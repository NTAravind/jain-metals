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

export type StateDeliveryInput = {
  state: string
  codAvailable?: boolean
  basePrice: number
  pricePerKg: number
  freeAboveValue?: number | null
  isActive?: boolean
}

export type StateDelivery = {
  id: string
  state: string
  codAvailable: boolean
  basePrice: number
  pricePerKg: number
  freeAboveValue: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type InternationalDeliveryInput = {
  country: string
  countryCode?: string | null
  basePrice: number
  pricePerKg: number
  freeAboveValue?: number | null
  deliveryDays?: string | null
  isActive?: boolean
}

export type InternationalDelivery = {
  id: string
  country: string
  countryCode: string | null
  basePrice: number
  pricePerKg: number
  freeAboveValue: number | null
  deliveryDays: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type DeliveryQuote = {
  fee: number
  serviceable: boolean
  city?: string
  state?: string
  country?: string
  source?: "pincode" | "state" | "international"
}

const transformPincode = (p: any): DeliveryPincode => ({
  ...p,
  basePrice: Number(p.basePrice),
  pricePerKg: Number(p.pricePerKg),
  freeAboveValue: p.freeAboveValue ? Number(p.freeAboveValue) : null,
})

const transformStateDelivery = (p: any): StateDelivery => ({
  ...p,
  basePrice: Number(p.basePrice),
  pricePerKg: Number(p.pricePerKg),
  freeAboveValue: p.freeAboveValue ? Number(p.freeAboveValue) : null,
})

const transformInternationalDelivery = (p: any): InternationalDelivery => ({
  ...p,
  basePrice: Number(p.basePrice),
  pricePerKg: Number(p.pricePerKg),
  freeAboveValue: p.freeAboveValue ? Number(p.freeAboveValue) : null,
})

// ─────────────────────────── Pincode Functions ───────────────────────────

export async function getAllDeliveryPincodes(): Promise<DeliveryPincode[]> {
  const pincodes = await prisma.deliveryPincode.findMany({
    orderBy: { pincode: "asc" },
  })
  return pincodes.map(transformPincode)
}

/**
 * Returns all distinct state names from the DeliveryPincode table,
 * along with whether all pincodes in that state share the same rates.
 */
export async function getDistinctPincodeStates(): Promise<{
  state: string
  pincodeCount: number
  commonBasePrice: number | null
  commonPricePerKg: number | null
}[]> {
  const grouped = await prisma.deliveryPincode.groupBy({
    by: ["state"],
    _count: { state: true },
    _min: { basePrice: true, pricePerKg: true },
    _max: { basePrice: true, pricePerKg: true },
    orderBy: { state: "asc" },
  })

  return grouped.map((g) => {
    const minBase = Number(g._min.basePrice ?? 0)
    const maxBase = Number(g._max.basePrice ?? 0)
    const minKg = Number(g._min.pricePerKg ?? 0)
    const maxKg = Number(g._max.pricePerKg ?? 0)
    return {
      state: g.state,
      pincodeCount: g._count.state,
      // If min == max, all pincodes share the same rate
      commonBasePrice: minBase === maxBase ? minBase : null,
      commonPricePerKg: minKg === maxKg ? minKg : null,
    }
  })
}

/**
 * Bulk-updates all DeliveryPincodes in a given state to use the provided rates.
 */
export async function applyRatesToStatePincodes(
  state: string,
  data: {
    basePrice: number
    pricePerKg: number
    freeAboveValue?: number | null
    codAvailable?: boolean
    isActive?: boolean
  }
): Promise<{ updated: number }> {
  const result = await prisma.deliveryPincode.updateMany({
    where: { state },
    data: {
      basePrice: data.basePrice,
      pricePerKg: data.pricePerKg,
      ...(data.freeAboveValue !== undefined && { freeAboveValue: data.freeAboveValue }),
      ...(data.codAvailable !== undefined && { codAvailable: data.codAvailable }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })
  return { updated: result.count }
}

export const getDeliveryPincodesPaginated = unstable_cache(async (
  page = 1,
  pageSize = 10,
  q?: string
) => {
  const where: any = q
    ? {
        OR: [
          { pincode: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { state: { contains: q, mode: "insensitive" } },
        ],
      }
    : {}

  const [pincodes, total] = await Promise.all([
    prisma.deliveryPincode.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { pincode: "asc" },
    }),
    prisma.deliveryPincode.count({ where }),
  ])
  return { pincodes: pincodes.map(transformPincode), total, pages: Math.ceil(total / pageSize) }
}, ["paginated-pincodes"], { revalidate: false })

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
  // Direct DB query — no cache, always fresh
  if (/^\d{6}$/.test(pincode)) {
    const pincodeResult = await prisma.deliveryPincode.findUnique({ where: { pincode } })
    if (pincodeResult && pincodeResult.isActive) {
      const p = transformPincode(pincodeResult)
      if (p.freeAboveValue && orderValue >= p.freeAboveValue) return 0
      return Math.ceil(p.basePrice + totalWeightKg * p.pricePerKg)
    }
  }
  return orderValue >= 2000 ? 0 : 100
}

export async function calculateDeliveryFeeByState(
  state: string,
  totalWeightKg: number,
  orderValue: number,
): Promise<number> {
  if (!state) return orderValue >= 2000 ? 0 : 100

  const stateResult = await getStateDeliveryByState(state)
  if (!stateResult || !stateResult.isActive) return orderValue >= 2000 ? 0 : 100

  if (stateResult.freeAboveValue && orderValue >= stateResult.freeAboveValue) return 0
  return Math.ceil(stateResult.basePrice + totalWeightKg * stateResult.pricePerKg)
}

export async function calculateInternationalDeliveryFee(
  country: string,
  totalWeightKg: number,
  orderValue: number,
): Promise<number> {
  if (!country) return 0

  const intlResult = await getInternationalDeliveryByCountry(country)
  if (!intlResult || !intlResult.isActive) return 0

  if (intlResult.freeAboveValue && orderValue >= intlResult.freeAboveValue) return 0
  return Math.ceil(intlResult.basePrice + totalWeightKg * intlResult.pricePerKg)
}

export async function resolveDeliveryQuote({
  pincode,
  state,
  country = "India",
  totalWeightKg,
  orderValue,
}: {
  pincode?: string | null
  state?: string | null
  country?: string | null
  totalWeightKg: number
  orderValue: number
}): Promise<DeliveryQuote> {
  const normalizedCountry = country?.trim() || "India"
  const isIndia = normalizedCountry.toLowerCase() === "india"

  if (!isIndia) {
    const international = await prisma.internationalDelivery.findFirst({
      where: {
        isActive: true,
        OR: [
          { country: { equals: normalizedCountry, mode: "insensitive" } },
          { countryCode: { equals: normalizedCountry, mode: "insensitive" } },
        ],
      },
    })

    if (!international) return { fee: 0, serviceable: false, country: normalizedCountry }

    const delivery = transformInternationalDelivery(international)
    const fee =
      delivery.freeAboveValue && orderValue >= delivery.freeAboveValue
        ? 0
        : Math.ceil(delivery.basePrice + totalWeightKg * delivery.pricePerKg)

    return {
      fee,
      serviceable: true,
      country: delivery.country,
      source: "international",
    }
  }

  // ── Pincode lookup: always direct DB, never cached ──
  if (pincode && /^\d{6}$/.test(pincode)) {
    const raw = await prisma.deliveryPincode.findUnique({ where: { pincode } })
    if (raw?.isActive) {
      const pincodeResult = transformPincode(raw)
      const fee =
        pincodeResult.freeAboveValue && orderValue >= pincodeResult.freeAboveValue
          ? 0
          : Math.ceil(pincodeResult.basePrice + totalWeightKg * pincodeResult.pricePerKg)

      return {
        fee,
        serviceable: true,
        city: pincodeResult.city,
        state: pincodeResult.state,
        country: "India",
        source: "pincode",
      }
    }
  }

  // ── State lookup: always direct DB, never cached ──
  const normalizedState = state?.trim()
  if (normalizedState) {
    const stateResult = await prisma.stateDelivery.findFirst({
      where: {
        state: { equals: normalizedState, mode: "insensitive" },
        isActive: true,
      },
    })

    if (stateResult) {
      const delivery = transformStateDelivery(stateResult)
      const fee =
        delivery.freeAboveValue && orderValue >= delivery.freeAboveValue
          ? 0
          : Math.ceil(delivery.basePrice + totalWeightKg * delivery.pricePerKg)

      return {
        fee,
        serviceable: true,
        state: delivery.state,
        country: "India",
        source: "state",
      }
    }
  }

  return {
    fee: orderValue >= 2000 ? 0 : 100,
    serviceable: true,
    state: normalizedState || undefined,
    country: "India",
  }
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

// ─────────────────────────── State Delivery Functions ───────────────────────────

export async function getAllStateDeliveries(): Promise<StateDelivery[]> {
  const states = await prisma.stateDelivery.findMany({
    orderBy: { state: "asc" },
  })
  return states.map(transformStateDelivery)
}

export async function getStateDeliveryByState(state: string): Promise<StateDelivery | null> {
  const result = await prisma.stateDelivery.findUnique({
    where: { state },
  })
  if (!result) return null
  return transformStateDelivery(result)
}

export const getStateDeliveryCached = unstable_cache(
  async (state: string): Promise<StateDelivery | null> => {
    const result = await prisma.stateDelivery.findUnique({
      where: { state },
    })
    if (!result) return null
    return transformStateDelivery(result)
  },
  ["state-delivery"],
  { revalidate: 3600, tags: ["delivery-states"] }
)

export async function createStateDelivery(data: StateDeliveryInput): Promise<StateDelivery> {
  const state = await prisma.stateDelivery.create({
    data: {
      state: data.state,
      codAvailable: data.codAvailable ?? false,
      basePrice: data.basePrice,
      pricePerKg: data.pricePerKg,
      freeAboveValue: data.freeAboveValue,
      isActive: data.isActive ?? true,
    },
  })
  return transformStateDelivery(state)
}

export async function updateStateDelivery(
  id: string,
  data: Partial<StateDeliveryInput>,
): Promise<StateDelivery> {
  const state = await prisma.stateDelivery.update({
    where: { id },
    data: {
      ...(data.state !== undefined && { state: data.state }),
      ...(data.codAvailable !== undefined && { codAvailable: data.codAvailable }),
      ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
      ...(data.pricePerKg !== undefined && { pricePerKg: data.pricePerKg }),
      ...(data.freeAboveValue !== undefined && { freeAboveValue: data.freeAboveValue }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })
  return transformStateDelivery(state)
}

export async function deleteStateDelivery(id: string): Promise<void> {
  await prisma.stateDelivery.delete({ where: { id } })
}

export async function getStateDeliveriesPaginated(
  page = 1,
  pageSize = 10,
  q?: string
) {
  const where: any = q
    ? { state: { contains: q, mode: "insensitive" } }
    : {}

  const [states, total] = await Promise.all([
    prisma.stateDelivery.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { state: "asc" },
    }),
    prisma.stateDelivery.count({ where }),
  ])
  return { states: states.map(transformStateDelivery), total, pages: Math.ceil(total / pageSize) }
}

// ─────────────────────────── International Delivery Functions ───────────────────────────

export async function getAllInternationalDeliveries(): Promise<InternationalDelivery[]> {
  const countries = await prisma.internationalDelivery.findMany({
    orderBy: { country: "asc" },
  })
  return countries.map(transformInternationalDelivery)
}

export async function getInternationalDeliveryByCountry(country: string): Promise<InternationalDelivery | null> {
  const result = await prisma.internationalDelivery.findUnique({
    where: { country },
  })
  if (!result) return null
  return transformInternationalDelivery(result)
}

export async function getInternationalDeliveryByCountryCode(countryCode: string): Promise<InternationalDelivery | null> {
  const result = await prisma.internationalDelivery.findUnique({
    where: { countryCode },
  })
  if (!result) return null
  return transformInternationalDelivery(result)
}

export const getInternationalDeliveryCached = unstable_cache(
  async (country: string): Promise<InternationalDelivery | null> => {
    const result = await prisma.internationalDelivery.findUnique({
      where: { country },
    })
    if (!result) return null
    return transformInternationalDelivery(result)
  },
  ["international-delivery"],
  { revalidate: 3600, tags: ["delivery-international"] }
)

export async function createInternationalDelivery(data: InternationalDeliveryInput): Promise<InternationalDelivery> {
  const country = await prisma.internationalDelivery.create({
    data: {
      country: data.country,
      countryCode: data.countryCode,
      basePrice: data.basePrice,
      pricePerKg: data.pricePerKg,
      freeAboveValue: data.freeAboveValue,
      deliveryDays: data.deliveryDays,
      isActive: data.isActive ?? true,
    },
  })
  return transformInternationalDelivery(country)
}

export async function updateInternationalDelivery(
  id: string,
  data: Partial<InternationalDeliveryInput>,
): Promise<InternationalDelivery> {
  const country = await prisma.internationalDelivery.update({
    where: { id },
    data: {
      ...(data.country !== undefined && { country: data.country }),
      ...(data.countryCode !== undefined && { countryCode: data.countryCode }),
      ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
      ...(data.pricePerKg !== undefined && { pricePerKg: data.pricePerKg }),
      ...(data.freeAboveValue !== undefined && { freeAboveValue: data.freeAboveValue }),
      ...(data.deliveryDays !== undefined && { deliveryDays: data.deliveryDays }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })
  return transformInternationalDelivery(country)
}

export async function deleteInternationalDelivery(id: string): Promise<void> {
  await prisma.internationalDelivery.delete({ where: { id } })
}

export async function getInternationalDeliveriesPaginated(
  page = 1,
  pageSize = 10,
  q?: string
) {
  const where: any = q
    ? {
        OR: [
          { country: { contains: q, mode: "insensitive" } },
          { countryCode: { contains: q, mode: "insensitive" } },
        ],
      }
    : {}

  const [countries, total] = await Promise.all([
    prisma.internationalDelivery.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { country: "asc" },
    }),
    prisma.internationalDelivery.count({ where }),
  ])
  return { countries: countries.map(transformInternationalDelivery), total, pages: Math.ceil(total / pageSize) }
}
