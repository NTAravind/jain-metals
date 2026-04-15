import { prisma } from "@/lib/db"
import { cache } from "react"

export const validateCoupon = cache(
  async (code: string, orderValue: number) => {
    const discount = await prisma.discount.findUnique({
      where: { code: code.trim().toUpperCase(), isActive: true },
    })
    if (!discount) return { valid: false as const, reason: "Invalid coupon code" }
    if (discount.expiresAt && discount.expiresAt < new Date())
      return { valid: false as const, reason: "Coupon has expired" }
    if (
      discount.maxUses != null &&
      discount.usedCount >= discount.maxUses
    )
      return { valid: false as const, reason: "Coupon usage limit reached" }
    if (
      discount.minOrderValue &&
      orderValue < Number(discount.minOrderValue)
    )
      return {
        valid: false as const,
        reason: `Min order ₹${discount.minOrderValue} required`,
      }
    return { valid: true as const, discount }
  },
)

export const getAllDiscounts = cache(async () => {
  return prisma.discount.findMany({ orderBy: { createdAt: "desc" } })
})

export const getDiscountsPaginated = cache(async (
  page = 1,
  pageSize = 10,
  q?: string
) => {
  const where: any = q
    ? {
        OR: [
          { code: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }
    : {}

  const [discounts, total] = await Promise.all([
    prisma.discount.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.discount.count({ where }),
  ])
  return { discounts, total, pages: Math.ceil(total / pageSize) }
})

export async function createDiscount(data: any) {
  return prisma.discount.create({ data })
}

export async function updateDiscount(id: string, data: any) {
  return prisma.discount.update({ where: { id }, data })
}

export async function deleteDiscount(id: string) {
  return prisma.discount.delete({ where: { id } })
}
