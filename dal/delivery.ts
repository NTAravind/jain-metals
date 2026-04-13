import { prisma } from "@/lib/db"
import { unstable_cache } from "next/cache"

export type DeliveryPincodeInput = {
  pincode: string
  city: string
  state: string
  codAvailable?: boolean
  basePrice: number
  pricePerKg: number
  freeAboveValue?: number | null
  isActive?: boolean
}

export type DeliveryPincode = {
  id: string
  pincode: string
  city: string
  state: string
  codAvailable: boolean
  basePrice: number
  pricePerKg: number
  freeAboveValue: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const transformPincode = (p: any): DeliveryPincode => ({
  ...p,
  basePrice: Number(p.basePrice),
  pricePerKg: Number(p.pricePerKg),
  freeAboveValue: p.freeAboveValue ? Number(p.freeAboveValue) : null,
})

export async function getAllDeliveryPincodes(): Promise<DeliveryPincode[]> {
  const pincodes = await prisma.deliveryPincode.findMany({
    orderBy: { pincode: "asc" },
  })
  return pincodes.map(transformPincode)
}

export async function getDeliveryPincodeById(id: string): Promise<DeliveryPincode | null> {
  const pincode = await prisma.deliveryPincode.findUnique({ where: { id } })
  if (!pincode) return null
  return transformPincode(pincode)
}

export const getDeliveryPincodeByPincode = unstable_cache(
  async (pincode: string): Promise<DeliveryPincode | null> => {
    const result = await prisma.deliveryPincode.findUnique({ where: { pincode } })
    if (!result) return null
    return transformPincode(result)
  },
  ["delivery-pincode"],
  { revalidate: 3600, tags: ["delivery-pincodes"] }
)

export async function createDeliveryPincode(data: DeliveryPincodeInput): Promise<DeliveryPincode> {
  const pincode = await prisma.deliveryPincode.create({
    data: {
      pincode: data.pincode,
      city: data.city,
      state: data.state,
      codAvailable: data.codAvailable ?? false,
      basePrice: data.basePrice,
      pricePerKg: data.pricePerKg,
      freeAboveValue: data.freeAboveValue,
      isActive: data.isActive ?? true,
    },
  })
  return transformPincode(pincode)
}

export async function updateDeliveryPincode(
  id: string,
  data: Partial<DeliveryPincodeInput>,
): Promise<DeliveryPincode> {
  const pincode = await prisma.deliveryPincode.update({
    where: { id },
    data: {
      ...(data.pincode !== undefined && { pincode: data.pincode }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.codAvailable !== undefined && { codAvailable: data.codAvailable }),
      ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
      ...(data.pricePerKg !== undefined && { pricePerKg: data.pricePerKg }),
      ...(data.freeAboveValue !== undefined && { freeAboveValue: data.freeAboveValue }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })
  return transformPincode(pincode)
}

export async function deleteDeliveryPincode(id: string): Promise<void> {
  await prisma.deliveryPincode.delete({ where: { id } })
}

export async function bulkCreateDeliveryPincodes(
  pincodes: Omit<DeliveryPincodeInput, "isActive">[]
): Promise<{ created: number; skipped: number }> {
  let created = 0
  let skipped = 0

  for (const pin of pincodes) {
    try {
      await prisma.deliveryPincode.create({
        data: {
          ...pin,
          isActive: true,
        },
      })
      created++
    } catch {
      skipped++
    }
  }

  return { created, skipped }
}

export async function calculateDeliveryFee(
  pincode: string,
  totalWeightKg: number,
  orderValue: number,
): Promise<number> {
  if (!/^\d{6}$/.test(pincode)) return 0

  const result = await getDeliveryPincodeByPincode(pincode)
  if (!result || !result.isActive) return 0

  if (result.freeAboveValue && orderValue >= result.freeAboveValue) return 0
  return Math.ceil(result.basePrice + totalWeightKg * result.pricePerKg)
}

export async function isPincodeServiceable(pincode: string): Promise<boolean> {
  if (!/^\d{6}$/.test(pincode)) return false
  const result = await getDeliveryPincodeByPincode(pincode)
  return result !== null && result.isActive
}

export const getDeliveryInfo = unstable_cache(
  async (pincode: string): Promise<{
    serviceable: boolean
    city?: string
    state?: string
    codAvailable?: boolean
    basePrice?: number
    pricePerKg?: number
    freeAboveValue?: number | null
  } | null> => {
    if (!/^\d{6}$/.test(pincode)) return null
    const result = await getDeliveryPincodeByPincode(pincode)
    if (!result) return { serviceable: false }
    return {
      serviceable: result.isActive,
      city: result.city,
      state: result.state,
      codAvailable: result.codAvailable,
      basePrice: result.basePrice,
      pricePerKg: result.pricePerKg,
      freeAboveValue: result.freeAboveValue,
    }
  },
  ["delivery-info"],
  { revalidate: 3600, tags: ["delivery-pincodes"] }
)
