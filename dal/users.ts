import { prisma } from "@/lib/db"
import { cache } from "react"

export const getAllCustomers = cache(async () => {
  return prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  })
})

export const getCustomerById = cache(async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
      addresses: true,
      orders: {
        include: {
          items: { include: { product: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
})
