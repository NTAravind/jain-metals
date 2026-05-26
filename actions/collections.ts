"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth-guards"
import {
  createCollection,
  updateCollection,
  deleteCollection,
  addProductToCollection,
  removeProductFromCollection,
  setCollectionProducts,
} from "@/dal/collections"
import { prisma } from "@/lib/db"

const CollectionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  discountPercent: z.coerce.number().min(0).max(100).nullable(),
})

function revalidateAll() {
  revalidateTag("collections", "default")
  revalidatePath("/admin/collections")
  revalidatePath("/")
}

export async function createCollectionAction(formData: FormData) {
  await requireAdmin()
  const raw = {
    name: formData.get("name") as string,
    description: formData.get("description") as string | undefined,
    discountPercent: formData.get("discountPercent")
      ? Number(formData.get("discountPercent"))
      : null,
  }
  const parsed = CollectionSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    const collection = await createCollection(parsed.data)
    revalidateAll()
    return { success: true, collection }
  } catch (e: any) {
    if (e.code === "P2002") return { error: "A collection with this name already exists" }
    return { error: "Failed to create collection" }
  }
}

export async function updateCollectionAction(id: string, formData: FormData) {
  await requireAdmin()
  const raw = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    discountPercent: formData.get("discountPercent")
      ? Number(formData.get("discountPercent"))
      : null,
  }
  const parsed = CollectionSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    const collection = await updateCollection(id, parsed.data)
    revalidateAll()
    revalidatePath(`/collections/${collection.slug}`)
    return { success: true, collection }
  } catch (e: any) {
    if (e.code === "P2002") return { error: "A collection with this name already exists" }
    return { error: "Failed to update collection" }
  }
}

export async function deleteCollectionAction(id: string) {
  await requireAdmin()
  try {
    await deleteCollection(id)
    revalidateAll()
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? "Failed to delete collection" }
  }
}

export async function addProductToCollectionAction(productId: string, collectionId: string) {
  await requireAdmin()
  try {
    await addProductToCollection(productId, collectionId)
    revalidateAll()
    return { success: true }
  } catch {
    return { error: "Failed to add product to collection" }
  }
}

export async function removeProductFromCollectionAction(productId: string, collectionId: string) {
  await requireAdmin()
  try {
    await removeProductFromCollection(productId, collectionId)
    revalidateAll()
    return { success: true }
  } catch {
    return { error: "Failed to remove product from collection" }
  }
}

export async function setCollectionProductsAction(collectionId: string, productIds: string[]) {
  await requireAdmin()
  try {
    await setCollectionProducts(collectionId, productIds)
    revalidateAll()
    return { success: true }
  } catch {
    return { error: "Failed to update collection products" }
  }
}

/** Apply the collection's discountPercent to all its products (override) */
export async function applyCollectionDiscountAction(collectionId: string) {
  await requireAdmin()
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: { products: { include: { product: { include: { variants: true } } } } },
  })
  if (!collection) return { error: "Collection not found" }
  if (collection.discountPercent == null) return { error: "No discount percent set on this collection" }

  const pct = collection.discountPercent
  const updates: any[] = []

  for (const pc of collection.products) {
    const p = pc.product
    const prodDiscounted =
      pct > 0 ? Math.round(Number(p.price) * (1 - pct / 100) * 100) / 100 : null
    updates.push(prisma.product.update({ where: { id: p.id }, data: { discountedPrice: prodDiscounted } }))

    for (const v of p.variants) {
      const varDiscounted =
        pct > 0 ? Math.round(Number(v.price) * (1 - pct / 100) * 100) / 100 : null
      updates.push(
        prisma.sizeVariant.update({
          where: { id: v.id },
          data: { discountedPrice: varDiscounted, discountPercent: pct },
        })
      )
    }
  }

  if (updates.length > 0) await prisma.$transaction(updates)
  revalidateAll()
  revalidatePath("/products")
  return { success: true, updated: collection.products.length }
}
