import { prisma } from "@/lib/db"
import { cache } from "react"
import { unstable_cache } from "next/cache"
import slugify from "slugify"

// ── Public helpers ────────────────────────────────────────────────────────────

/** All non-default collections (for nav dropdown) */
export const getNonDefaultCollections = unstable_cache(
  async () => {
    return prisma.collection.findMany({
      where: { isDefault: false },
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    })
  },
  ["collections_non_default"],
  { tags: ["collections"], revalidate: 3600 }
)

/** Single collection by slug (storefront page) */
export const getCollectionBySlug = cache(async (slug: string) => {
  return prisma.collection.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          product: {
            include: {
              category: true,
              variants: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
  })
})

// ── Admin helpers ─────────────────────────────────────────────────────────────

/** All collections for admin list */
export const getAllCollectionsAdmin = cache(async () => {
  return prisma.collection.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
    },
  })
})

/** Single collection with product details for admin edit */
export const getCollectionAdminById = cache(async (id: string) => {
  return prisma.collection.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: {
            select: { id: true, name: true, images: true, price: true, discountedPrice: true, sku: true },
          },
        },
      },
    },
  })
})

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createCollection(data: {
  name: string
  description?: string
  discountPercent?: number | null
}) {
  const slug = slugify(data.name, { lower: true, strict: true })
  return prisma.collection.create({
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
      discountPercent: data.discountPercent ?? null,
      isDefault: false,
    },
  })
}

export async function updateCollection(
  id: string,
  data: {
    name?: string
    description?: string | null
    discountPercent?: number | null
  }
) {
  const update: any = { ...data }
  if (data.name) {
    update.slug = slugify(data.name, { lower: true, strict: true })
  }
  return prisma.collection.update({ where: { id }, data: update })
}

export async function deleteCollection(id: string) {
  // Don't allow deleting the default collection
  const col = await prisma.collection.findUnique({ where: { id } })
  if (col?.isDefault) throw new Error("Cannot delete the default collection")
  return prisma.collection.delete({ where: { id } })
}

/** Add a product to a collection */
export async function addProductToCollection(productId: string, collectionId: string) {
  return prisma.productCollection.upsert({
    where: { productId_collectionId: { productId, collectionId } },
    create: { productId, collectionId },
    update: {},
  })
}

/** Remove a product from a collection */
export async function removeProductFromCollection(productId: string, collectionId: string) {
  return prisma.productCollection.deleteMany({
    where: { productId, collectionId },
  })
}

/** Replace all products in a collection at once */
export async function setCollectionProducts(collectionId: string, productIds: string[]) {
  await prisma.productCollection.deleteMany({ where: { collectionId } })
  if (productIds.length > 0) {
    await prisma.productCollection.createMany({
      data: productIds.map((productId) => ({ productId, collectionId })),
      skipDuplicates: true,
    })
  }
}

/**
 * Serialize a product fetched through ProductCollection join for storefront use.
 */
export function serializeCollectionProduct(pc: any) {
  const p = pc.product
  return {
    ...p,
    price: Number(p.price),
    discountedPrice: p.discountedPrice ? Number(p.discountedPrice) : null,
    variants: p.variants?.map((v: any) => ({
      ...v,
      price: Number(v.price),
      discountedPrice: v.discountedPrice ? Number(v.discountedPrice) : null,
    })) ?? [],
  }
}
