"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import slugify from "slugify"
import { nanoid } from "nanoid"
import { requireAdmin } from "@/lib/auth-guards"
import { createProduct, updateProduct, deleteProduct, getProductByIdAdmin } from "@/dal/products"
import { deleteMultipleFromS3, urlToKey } from "@/server/lib/s3"

const VariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name required"),
  price: z.coerce.number().positive("Price must be positive"),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  stock: z.coerce.number().int().min(0).default(0),
  sortOrder: z.coerce.number().int().default(0),
})

const ProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  categoryId: z.string().optional(),
  style: z.string().optional(),
  price: z.coerce.number().positive(),
  discountedPrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0),
  weightKg: z.coerce.number().positive().optional(),
  heightCm: z.coerce.number().positive().optional(),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  videoUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
})

export async function createProductAction(formData: FormData) {
  await requireAdmin()

  const images = formData.getAll("images").map((v) => v.toString()).filter(Boolean)

  const rawData = Object.fromEntries(formData.entries())
  const parsedData = ProductSchema.parse({
    ...rawData,
    images,
    isActive: formData.get("isActive") === "true",
  })

  // Parse variants from JSON string
  const variantsRaw = formData.get("variants")?.toString()
  let variants: z.infer<typeof VariantSchema>[] = []
  if (variantsRaw) {
    try {
      const parsed = JSON.parse(variantsRaw)
      variants = z.array(VariantSchema).parse(parsed)
    } catch {
      // ignore invalid variants
    }
  }

  let { categoryId, style } = parsedData
  if (!categoryId || categoryId === "none") categoryId = undefined
  if (!style || style === "none") style = undefined

  const slug = slugify(parsedData.name, { lower: true, strict: true }) + "-" + nanoid(4)
  const sku = nanoid(8).toUpperCase()

  const product = await createProduct({
    ...parsedData,
    slug,
    sku,
    categoryId: categoryId || null,
    style: style || null,
    discountedPrice: parsedData.discountedPrice || null,
    weightKg: parsedData.weightKg || null,
    heightCm: parsedData.heightCm || null,
    videoUrl: parsedData.videoUrl || null,
    variants: variants.map((v, i) => ({ ...v, sortOrder: v.sortOrder ?? i })),
  })

  revalidatePath("/admin/products")
  revalidatePath("/products")
  return { success: true, productId: product.id }
}

export async function updateProductAction(id: string, formData: FormData) {
  await requireAdmin()

  const images = formData.getAll("images").map((v) => v.toString()).filter(Boolean)

  const rawData = Object.fromEntries(formData.entries())
  const parsedData = ProductSchema.parse({
    ...rawData,
    images,
    isActive: formData.get("isActive") === "true",
  })

  // Parse variants from JSON string
  const variantsRaw = formData.get("variants")?.toString()
  let variants: z.infer<typeof VariantSchema>[] | undefined
  if (variantsRaw) {
    try {
      const parsed = JSON.parse(variantsRaw)
      variants = z.array(VariantSchema).parse(parsed)
    } catch {
      variants = undefined
    }
  }

  let { categoryId, style } = parsedData
  if (!categoryId || categoryId === "none") categoryId = undefined
  if (!style || style === "none") style = undefined

  // ── S3 cleanup: delete images removed in this edit ──────────────────────────
  const existing = await getProductByIdAdmin(id)
  if (existing) {
    const newSet = new Set(images)
    const removedUrls = existing.images.filter((url: string) => !newSet.has(url))
    const keysToDelete = removedUrls.map((url: string) => urlToKey(url)).filter((k: string | null): k is string => k !== null)

    // Also handle video removal
    const videoRemoved = existing.videoUrl && existing.videoUrl !== (parsedData.videoUrl || null)
    if (videoRemoved && existing.videoUrl) {
      const vk = urlToKey(existing.videoUrl)
      if (vk) keysToDelete.push(vk)
    }

    if (keysToDelete.length > 0) {
      await deleteMultipleFromS3(keysToDelete).catch((err) => {
        console.error("[updateProduct] S3 cleanup error:", err.message)
      })
    }
  }

  await updateProduct(
    id,
    {
      ...parsedData,
      categoryId: categoryId || null,
      style: style || null,
      discountedPrice: parsedData.discountedPrice || null,
      weightKg: parsedData.weightKg || null,
      heightCm: parsedData.heightCm || null,
      videoUrl: parsedData.videoUrl || null,
    },
    variants?.map((v, i) => ({ ...v, sortOrder: v.sortOrder ?? i })),
  )

  revalidatePath("/admin/products")
  revalidatePath("/products")
  revalidatePath(`/products/${id}`)
  return { success: true }
}

export async function deleteProductAction(id: string) {
  await requireAdmin()

  // ── S3 cleanup: delete all images + video before removing from DB ───────────
  const existing = await getProductByIdAdmin(id)
  if (existing) {
    const imageKeys = existing.images.map((url: string) => urlToKey(url)).filter((k: string | null): k is string => k !== null)
    const videoKey = existing.videoUrl ? urlToKey(existing.videoUrl) : null
    const allKeys = videoKey ? [...imageKeys, videoKey] : imageKeys

    if (allKeys.length > 0) {
      await deleteMultipleFromS3(allKeys).catch((err) => {
        // Log but don't fail — product must still be deleted from DB
        console.error("[deleteProduct] S3 cleanup error:", err.message)
      })
    }
  }

  await deleteProduct(id)
  revalidatePath("/admin/products")
  revalidatePath("/products")
  return { success: true }
}
