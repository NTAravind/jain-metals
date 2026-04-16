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

export const getProductsAdminPaginated = cache(async (
  page = 1,
  pageSize = 10,
  q?: string,
  category?: string,
  stock?: string
) => {
  const where: any = {}

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ]
  }

  if (category && category !== "all") {
    where.categoryId = category
  }

  if (stock === "in_stock") {
    where.stock = { gt: 0 }
  } else if (stock === "out_of_stock") {
    where.stock = { lte: 0 }
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

// ─────────────────────────── Product Discount Management ─────────────────────────────

export type DiscountApplyType = "PERCENTAGE" | "FIXED" | "EXACT"

/**
 * Apply a discount to a single product (and all its variants).
 * - PERCENTAGE: discountedPrice = price * (1 - value/100)
 * - FIXED:      discountedPrice = price - value
 * - EXACT:      discountedPrice = value (set directly)
 */
export async function applyProductDiscount(
  productId: string,
  type: DiscountApplyType,
  value: number
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  })
  if (!product) throw new Error("Product not found")

  const computeDiscounted = (basePrice: number) => {
    if (type === "PERCENTAGE") return Math.round(basePrice * (1 - value / 100) * 100) / 100
    if (type === "FIXED") return Math.max(0, Math.round((basePrice - value) * 100) / 100)
    return value // EXACT
  }

  const productDiscounted = computeDiscounted(Number(product.price))

  const updates: any[] = [
    prisma.product.update({
      where: { id: productId },
      data: { discountedPrice: productDiscounted },
    }),
  ]

  for (const variant of product.variants) {
    const variantBase = Number(variant.price)
    const discountedPrice = computeDiscounted(variantBase)
    const discountPercent = type === "PERCENTAGE" ? value
      : Math.round(((variantBase - discountedPrice) / variantBase) * 100 * 100) / 100

    updates.push(
      prisma.sizeVariant.update({
        where: { id: variant.id },
        data: { discountedPrice, discountPercent },
      })
    )
  }

  await prisma.$transaction(updates)
  return { updated: 1 }
}

/**
 * Apply a discount to all products in a category.
 */
export async function applyCategoryDiscountTyped(
  categoryId: string,
  type: DiscountApplyType,
  value: number
) {
  const products = await prisma.product.findMany({
    where: { categoryId },
    include: { variants: true },
  })

  const computeDiscounted = (basePrice: number) => {
    if (type === "PERCENTAGE") return Math.round(basePrice * (1 - value / 100) * 100) / 100
    if (type === "FIXED") return Math.max(0, Math.round((basePrice - value) * 100) / 100)
    return value // EXACT
  }

  const updates: any[] = []
  for (const product of products) {
    const productDiscounted = computeDiscounted(Number(product.price))
    updates.push(
      prisma.product.update({
        where: { id: product.id },
        data: { discountedPrice: productDiscounted },
      })
    )
    for (const variant of product.variants) {
      const variantBase = Number(variant.price)
      const discountedPrice = computeDiscounted(variantBase)
      const discountPercent = type === "PERCENTAGE" ? value
        : Math.round(((variantBase - discountedPrice) / variantBase) * 100 * 100) / 100
      updates.push(
        prisma.sizeVariant.update({
          where: { id: variant.id },
          data: { discountedPrice, discountPercent },
        })
      )
    }
  }

  if (updates.length > 0) await prisma.$transaction(updates)
  return { updated: products.length }
}

/**
 * Remove discount from a single product (set discountedPrice = null, discountPercent = 0).
 */
export async function clearProductDiscount(productId: string) {
  await prisma.product.update({
    where: { id: productId },
    data: { discountedPrice: null },
  })
  await prisma.sizeVariant.updateMany({
    where: { productId },
    data: { discountedPrice: null, discountPercent: 0 },
  })
  return { cleared: 1 }
}

/**
 * Remove discounts from all products in a category.
 */
export async function clearCategoryDiscount(categoryId: string) {
  const products = await prisma.product.findMany({
    where: { categoryId },
    select: { id: true },
  })
  const ids = products.map((p) => p.id)

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { discountedPrice: null },
  })
  await prisma.sizeVariant.updateMany({
    where: { productId: { in: ids } },
    data: { discountedPrice: null, discountPercent: 0 },
  })
  return { cleared: products.length }
}

/**
 * Get all products with their current discount status, paginated.
 */
export async function getProductsWithDiscounts(
  page = 1,
  pageSize = 10,
  q?: string,
  categoryId?: string
) {
  const where: any = {}
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ]
  }
  if (categoryId && categoryId !== "all") {
    where.categoryId = categoryId
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
      orderBy: { name: "asc" },
    }),
    prisma.product.count({ where }),
  ])

  return {
    products: products.map(serializeProduct),
    total,
    pages: Math.ceil(total / pageSize),
  }
}
