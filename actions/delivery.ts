"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth-guards"
import {
  createDeliveryPincode,
  updateDeliveryPincode,
  deleteDeliveryPincode,
  bulkCreateDeliveryPincodes,
  getDeliveryPincodeByPincode,
} from "@/dal/delivery"

const CACHE_TAG = "delivery-pincodes"

const DeliveryPincodeSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  codAvailable: z.coerce.boolean().optional(),
  basePrice: z.coerce.number().min(0),
  pricePerKg: z.coerce.number().min(0),
  freeAboveValue: z.coerce.number().optional(),
  isActive: z.coerce.boolean().optional(),
})

export async function createDeliveryPincodeAction(formData: FormData) {
  await requireAdmin()
  const data = DeliveryPincodeSchema.parse(Object.fromEntries(formData))
  await createDeliveryPincode(data)
  revalidateTag(CACHE_TAG, "default")
  revalidatePath("/admin/delivery")
  return { success: true }
}

export async function updateDeliveryPincodeAction(id: string, formData: FormData) {
  await requireAdmin()
  const data = DeliveryPincodeSchema.parse(Object.fromEntries(formData))
  await updateDeliveryPincode(id, data)
  revalidateTag(CACHE_TAG, "default")
  revalidatePath("/admin/delivery")
  return { success: true }
}

export async function deleteDeliveryPincodeAction(id: string) {
  await requireAdmin()
  await deleteDeliveryPincode(id)
  revalidateTag(CACHE_TAG, "default")
  revalidatePath("/admin/delivery")
  return { success: true }
}

const BulkPincodeSchema = z.object({
  pincodes: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  codAvailable: z.coerce.boolean().optional(),
  basePrice: z.coerce.number().min(0),
  pricePerKg: z.coerce.number().min(0),
  freeAboveValue: z.coerce.number().optional(),
})

export async function bulkCreateDeliveryPincodesAction(formData: FormData) {
  await requireAdmin()
  const data = BulkPincodeSchema.parse(Object.fromEntries(formData))
  const pincodeList = data.pincodes
    .split(/[,\n]/)
    .map((p) => p.trim())
    .filter((p) => /^\d{6}$/.test(p))
    .map((pincode) => ({
      pincode,
      city: data.city,
      state: data.state,
      codAvailable: data.codAvailable ?? false,
      basePrice: data.basePrice,
      pricePerKg: data.pricePerKg,
      freeAboveValue: data.freeAboveValue,
    }))

  const result = await bulkCreateDeliveryPincodes(pincodeList)
  revalidateTag(CACHE_TAG, "default")
  revalidatePath("/admin/delivery")
  return result
}

export async function checkPincodeAvailability(pincode: string) {
  const result = await getDeliveryPincodeByPincode(pincode)
  if (!result) return { available: false }
  return {
    available: result.isActive,
    city: result.city,
    state: result.state,
    codAvailable: result.codAvailable,
    basePrice: result.basePrice,
    pricePerKg: result.pricePerKg,
    freeAboveValue: result.freeAboveValue,
  }
}
