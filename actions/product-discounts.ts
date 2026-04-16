"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth-guards"
import {
  applyProductDiscount,
  applyCategoryDiscountTyped,
  clearProductDiscount,
  clearCategoryDiscount,
  type DiscountApplyType,
} from "@/dal/products"

const DiscountSchema = z.object({
  type: z.enum(["PERCENTAGE", "FIXED", "EXACT"]),
  value: z.coerce.number().positive("Value must be positive"),
})

export async function applyProductDiscountAction(
  productId: string,
  formData: FormData
) {
  await requireAdmin()
  const { type, value } = DiscountSchema.parse(Object.fromEntries(formData))
  const result = await applyProductDiscount(productId, type as DiscountApplyType, value)
  revalidatePath("/admin/discounts")
  revalidatePath("/admin/products")
  revalidatePath("/products")
  return { success: true, ...result }
}

export async function clearProductDiscountAction(productId: string) {
  await requireAdmin()
  const result = await clearProductDiscount(productId)
  revalidatePath("/admin/discounts")
  revalidatePath("/admin/products")
  revalidatePath("/products")
  return { success: true, ...result }
}

export async function applyCategoryDiscountAction(
  categoryId: string,
  formData: FormData
) {
  await requireAdmin()
  const { type, value } = DiscountSchema.parse(Object.fromEntries(formData))
  const result = await applyCategoryDiscountTyped(categoryId, type as DiscountApplyType, value)
  revalidatePath("/admin/discounts")
  revalidatePath("/admin/products")
  revalidatePath("/products")
  return { success: true, ...result }
}

export async function clearCategoryDiscountAction(categoryId: string) {
  await requireAdmin()
  const result = await clearCategoryDiscount(categoryId)
  revalidatePath("/admin/discounts")
  revalidatePath("/admin/products")
  revalidatePath("/products")
  return { success: true, ...result }
}
