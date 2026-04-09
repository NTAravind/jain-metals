"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin, requireOwnership } from "@/lib/auth-guards"
import { updateOrderStatus, getOrderById } from "@/dal/orders"

export async function updateOrderStatusAction(
  orderId: string,
  status: string,
) {
  await requireAdmin()
  await updateOrderStatus(orderId, status)
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/orders")
  return { success: true }
}

export async function getOrderAction(orderId: string) {
  const order = await getOrderById(orderId)
  if (!order) return { error: "Order not found" }
  await requireOwnership(order.userId)
  return { success: true, order }
}
