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

export const getCustomersPaginated = cache(async (
  page = 1,
  pageSize = 10,
  q?: string,
  hasOrders?: string
) => {
  const where: any = {
    role: "CUSTOMER",
    ...(q ? {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    } : {})
  }

  if (hasOrders === "with_orders") {
    where.orders = { some: {} }
  } else if (hasOrders === "no_orders") {
    where.orders = { none: {} }
  }

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ])
  return { customers, total, pages: Math.ceil(total / pageSize) }
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
