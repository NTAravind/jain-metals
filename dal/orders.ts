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
