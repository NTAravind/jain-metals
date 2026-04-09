"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth-guards"
import {
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "@/dal/discounts"

const DiscountSchema = z.object({
  code: z
    .string()
    .transform((v) => v.toUpperCase())
    .optional(),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_DELIVERY"]),
  value: z.coerce.number().positive(),
  minOrderValue: z.coerce.number().optional(),
  maxUses: z.coerce.number().int().optional(),
  freeDelivery: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  expiresAt: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
})

export async function createDiscountAction(formData: FormData) {
  await requireAdmin()
  const data = DiscountSchema.parse(Object.fromEntries(formData))
  await createDiscount(data)
  revalidatePath("/admin/discounts")
  return { success: true }
}

export async function updateDiscountAction(id: string, formData: FormData) {
  await requireAdmin()
  const data = DiscountSchema.parse(Object.fromEntries(formData))
  await updateDiscount(id, data)
  revalidatePath("/admin/discounts")
  return { success: true }
}

export async function deleteDiscountAction(id: string) {
  await requireAdmin()
  await deleteDiscount(id)
  revalidatePath("/admin/discounts")
  return { success: true }
}
