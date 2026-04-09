import { prisma } from "@/lib/db"
import { cache } from "react"

function serializeVariant(v: any) {
  return {
    ...v,
    price: Number(v.price),
    discountedPrice: v.discountedPrice ? Number(v.discountedPrice) : null,
  }
}

function serializeProduct(product: any) {
  if (!product) return product;
  return {
    ...product,
    price: Number(product.price),
    discountedPrice: product.discountedPrice ? Number(product.discountedPrice) : null,
    variants: product.variants?.map(serializeVariant) ?? [],
  };
}

export const getProducts = cache(async (
  page = 1,
  pageSize = 12,
  categorySlug?: string,
  q?: string
) => {
  const where: any = {
    isActive: true,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(q && q.trim().length > 0
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { category: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: { orderBy: { sortOrder: "asc" } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ])
  return { products: products.map(serializeProduct), total, pages: Math.ceil(total / pageSize) }
})

export const getProductBySlug = cache(async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      variants: { orderBy: { sortOrder: "asc" } },
    }
  })
  return serializeProduct(product)
})

export const getProductByIdAdmin = cache(async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: { orderBy: { sortOrder: "asc" } },
    }
  })
  return serializeProduct(product)
})

export const getAllProductsAdmin = cache(async () => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      variants: { orderBy: { sortOrder: "asc" } },
    }
  })
  return products.map(serializeProduct)
})

export async function createProduct(data: {
  name: string
  slug: string
  sku: string
  description: string
  categoryId?: string | null
  style?: string | null
  price: number
  discountedPrice?: number | null
  stock: number
  weightKg?: number | null
  heightCm?: number | null
  images: string[]
  videoUrl?: string | null
  isActive: boolean
  variants?: {
    name: string
    price: number
    discountPercent: number
    stock: number
    sortOrder: number
  }[]
}) {
  const { variants, ...productData } = data
  return prisma.product.create({
    data: {
      ...productData,
      variants: variants && variants.length > 0
        ? {
            create: variants.map((v) => ({
              name: v.name,
              price: v.price,
              discountPercent: v.discountPercent,
              discountedPrice: v.discountPercent > 0
                ? Math.round(v.price * (1 - v.discountPercent / 100) * 100) / 100
                : null,
              stock: v.stock,
              sortOrder: v.sortOrder,
            })),
          }
        : undefined,
    },
    include: { variants: true },
  })
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string
    slug: string
    sku: string
    description: string
    categoryId: string | null
    style: string | null
    price: number
    discountedPrice: number | null
    stock: number
    weightKg: number | null
    heightCm: number | null
    images: string[]
    videoUrl: string | null
    isActive: boolean
  }>,
  variants?: {
    id?: string
    name: string
    price: number
    discountPercent: number
    stock: number
    sortOrder: number
  }[],
) {
  // If variants provided, do a delete-all + recreate approach for simplicity
  if (variants !== undefined) {
    await prisma.sizeVariant.deleteMany({ where: { productId: id } })
    if (variants.length > 0) {
      await prisma.sizeVariant.createMany({
        data: variants.map((v) => ({
          productId: id,
          name: v.name,
          price: v.price,
          discountPercent: v.discountPercent,
          discountedPrice: v.discountPercent > 0
            ? Math.round(v.price * (1 - v.discountPercent / 100) * 100) / 100
            : null,
          stock: v.stock,
          sortOrder: v.sortOrder,
        })),
      })
    }
  }

  return prisma.product.update({ where: { id }, data })
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } })
}

/** Apply a discount percentage to all variants of all products in a category */
export async function applyCategoryDiscount(categoryId: string, discountPercent: number) {
  const products = await prisma.product.findMany({
    where: { categoryId },
    include: { variants: true },
  })

  const updates = []
  for (const product of products) {
    for (const variant of product.variants) {
      const price = Number(variant.price)
      const discountedPrice = discountPercent > 0
        ? Math.round(price * (1 - discountPercent / 100) * 100) / 100
        : null
      updates.push(
        prisma.sizeVariant.update({
          where: { id: variant.id },
          data: { discountPercent, discountedPrice },
        })
      )
    }
    // Also update product-level discount
    const prodPrice = Number(product.price)
    const prodDiscounted = discountPercent > 0
      ? Math.round(prodPrice * (1 - discountPercent / 100) * 100) / 100
      : null
    updates.push(
      prisma.product.update({
        where: { id: product.id },
        data: { discountedPrice: prodDiscounted },
      })
    )
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates)
  }

  return { updated: products.length }
}
