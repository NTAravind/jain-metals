import { prisma } from "@/lib/db"
import { cache } from "react"

const ORDER_INCLUDE = {
  user: { select: { id: true, name: true, phone: true } },
  address: true,
  discount: true,
  items: {
    include: {
      product: { select: { id: true, name: true, slug: true, images: true } },
    },
  },
} as const

export const getAllOrders = cache(async () => {
  return prisma.order.findMany({
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  })
})

export const getOrdersPaginated = cache(async (
  page = 1,
  pageSize = 10,
  q?: string,
  status?: string
) => {
  const where: any = {}

  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { phone: { contains: q, mode: "insensitive" } } },
    ]
  }

  if (status && status !== "all") {
    where.status = status.toUpperCase()
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ])
  return { orders, total, pages: Math.ceil(total / pageSize) }
})

export const getOrderById = cache(async (id: string) => {
  return prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE })
})

export const getOrdersByUser = cache(async (userId: string) => {
  return prisma.order.findMany({
    where: { userId },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  })
})

export async function updateOrderStatus(id: string, status: string) {
  return prisma.order.update({
    where: { id },
    data: { status: status as any },
  })
}
