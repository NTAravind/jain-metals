"use server"

import { validateCoupon } from "@/dal/discounts"

export async function validateCouponAction(code: string, orderValue: number) {
  if (!code || code.trim().length === 0) {
    return { valid: false as const, reason: "Please enter a coupon code" }
  }
  const result = await validateCoupon(code.trim().toUpperCase(), orderValue)
  if (!result.valid) {
    return { valid: false as const, reason: result.reason }
  }
  const discount = result.discount
  return {
    valid: true as const,
    discountId: discount.id,
    type: discount.type as "PERCENTAGE" | "FIXED" | "FREE_DELIVERY",
    value: Number(discount.value),
    code: discount.code,
  }
}
