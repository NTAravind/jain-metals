import { prisma } from "@/lib/db"

const INSTATE_PREFIXES = (
  process.env.INSTATE_PINCODE_PREFIXES ?? "60,62,64"
).split(",")

export function getDeliveryZone(
  pincode: string,
): "INSTATE" | "DOMESTIC" | "INTERNATIONAL" {
  if (!/^\d{6}$/.test(pincode)) return "INTERNATIONAL"
  return INSTATE_PREFIXES.includes(pincode.slice(0, 2)) ? "INSTATE" : "DOMESTIC"
}

export async function calculateDeliveryFee(
  pincode: string,
  totalWeightKg: number,
  orderValue: number,
): Promise<number> {
  const zone = getDeliveryZone(pincode)
  const config = await prisma.deliveryConfig.findUnique({ where: { zone } })
  if (!config) return 0
  if (config.freeAboveValue && orderValue >= Number(config.freeAboveValue))
    return 0
  return Math.ceil(
    Number(config.basePrice) + totalWeightKg * Number(config.pricePerKg),
  )
}
