"use server"

import { prisma } from "@/lib/db"
import { requireCustomer } from "@/lib/auth-guards"
import { validateCoupon } from "@/dal/discounts"
import { resolveDeliveryQuote } from "@/dal/delivery"
import Razorpay from "razorpay"
import { z } from "zod"
import crypto from "crypto"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

const AddressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().regex(/^\+?[0-9]{10,13}$/, "Invalid phone"),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  country: z.string().default("India"),
})

const CheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        sizeVariantId: z.string().optional(),
        sizeName: z.string().optional(),
      }),
    )
    .min(1),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode").optional(),
  couponCode: z.string().optional(),
  addressId: z.string().optional(),
  isPickup: z.boolean().optional(),
  pickupDetails: z.object({
    fullName: z.string().min(2),
    phone: z.string().regex(/^\+?[0-9]{10,13}$/, "Invalid phone"),
  }).optional(),
})

// ── Create delivery address ───────────────────────────────────────────────────

export async function createAddressAction(formData: FormData) {
  const user = await requireCustomer()
  const data = AddressSchema.parse(Object.fromEntries(formData))
  
  const address = await prisma.address.create({
    data: { ...data, userId: user.id, isDefault: true },
  })
  
  // Unset previous defaults
  await prisma.address.updateMany({
    where: { userId: user.id, id: { not: address.id } },
    data: { isDefault: false },
  })

  return { success: true as const, addressId: address.id }
}

export async function getDefaultAddressAction() {
  const user = await requireCustomer()
  const address = await prisma.address.findFirst({
    where: { userId: user.id, city: { not: "Local Store" } },
    orderBy: { isDefault: "desc" },
  })
  return address
}

// ── Calculate delivery fee preview ───────────────────────────────────────────

export async function getDeliveryFeeAction(
  pincode: string,
  subtotal: number,
  totalWeightKg: number,
  state?: string,
): Promise<{ fee: number; serviceable: boolean; city?: string; state?: string }> {
  return resolveDeliveryQuote({
    pincode,
    state,
    totalWeightKg,
    orderValue: subtotal,
  })
}

// ── STEP 1: Create Razorpay order ─────────────────────────────────────────────

export async function createRazorpayOrder(
  input: z.infer<typeof CheckoutSchema>,
) {
  const user = await requireCustomer()
  const { items, pincode, couponCode, addressId, isPickup, pickupDetails } = CheckoutSchema.parse(input)

  const phone = user.phone

  let finalAddressId = addressId

  if (isPickup) {
    if (!pickupDetails) throw new Error("Pickup details required")
    const dummyAddr = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: pickupDetails.fullName,
        phone: pickupDetails.phone,
        line1: "Store Pickup",
        city: "Local Store",
        state: "Local",
        pincode: "000000",
        country: "India",
      }
    })
    finalAddressId = dummyAddr.id
  } else {
    if (!finalAddressId) throw new Error("Address ID is required for delivery")
    const address = await prisma.address.findUnique({ where: { id: finalAddressId } })
    if (!address || address.userId !== user.id) throw new Error("Invalid address")
  }

  let deliveryAddress:
    | { pincode: string; state: string; country: string }
    | null = null
  if (!isPickup && finalAddressId) {
    const addr = await prisma.address.findUnique({ where: { id: finalAddressId } })
    if (addr) {
      deliveryAddress = {
        pincode: addr.pincode,
        state: addr.state,
        country: addr.country,
      }
    }
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
    include: { variants: true },
  })

  // Collect variant data for price & stock lookup
  const variantMap = new Map<string, any>()
  for (const p of products) {
    for (const v of p.variants) {
      variantMap.set(v.id, v)
    }
  }

  for (const item of items) {
    const product = products.find((v) => v.id === item.productId)
    if (!product) throw new Error("Product not found")
    if (item.sizeVariantId) {
      const variant = variantMap.get(item.sizeVariantId)
      if (!variant) throw new Error(`Size variant not found`)
      if (variant.stock < item.quantity)
        throw new Error(`Only ${variant.stock} of "${product.name} (${variant.name})" in stock`)
    } else {
      if (product.stock < item.quantity)
        throw new Error(`Only ${product.stock} of "${product.name}" in stock`)
    }
  }

  const subtotal = items.reduce((sum: number, item) => {
    const product = products.find((vr) => vr.id === item.productId)!
    let activePrice: number
    if (item.sizeVariantId) {
      const variant = variantMap.get(item.sizeVariantId)!
      activePrice = variant.discountedPrice ? Number(variant.discountedPrice) : Number(variant.price)
    } else {
      activePrice = product.discountedPrice ? Number(product.discountedPrice) : Number(product.price)
    }
    return sum + activePrice * item.quantity
  }, 0)

  const totalWeightKg = items.reduce((sum: number, item) => {
    const vr = products.find((v) => v.id === item.productId)!
    return sum + (vr.weightKg ?? 1) * item.quantity
  }, 0)

  let deliveryFee = 0
  if (!isPickup) {
    const deliveryQuote = await resolveDeliveryQuote({
      pincode: pincode ?? deliveryAddress?.pincode,
      state: deliveryAddress?.state,
      country: deliveryAddress?.country,
      totalWeightKg,
      orderValue: subtotal,
    })

    if (!deliveryQuote.serviceable) {
      throw new Error("Delivery is not available for this address")
    }

    deliveryFee = deliveryQuote.fee
  }

  let discountAmount = 0
  let discountId: string | undefined
  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal)
    if (result.valid) {
      const d = result.discount
      discountId = d.id
      if (d.type === "PERCENTAGE") discountAmount = (subtotal * Number(d.value)) / 100
      else if (d.type === "FIXED") discountAmount = Number(d.value)
      else if (d.type === "FREE_DELIVERY") discountAmount = deliveryFee
    }
  }

  const total = Math.max(0, subtotal + deliveryFee - discountAmount)

  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(total * 100),
    currency: "INR",
    receipt: `order_${Date.now()}`,
    notes: { userId: user.id, phone: phone ?? "" },
  })

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      addressId: finalAddressId!,
      discountId,
      subtotal,
      deliveryFee,
      discountAmount,
      total,
      razorpayOrderId: rzpOrder.id,
      items: {
        create: items.map((item) => {
          const product = products.find((vr) => vr.id === item.productId)!
          let unitPrice: number
          if (item.sizeVariantId) {
            const variant = variantMap.get(item.sizeVariantId)!
            unitPrice = variant.discountedPrice ? Number(variant.discountedPrice) : Number(variant.price)
          } else {
            unitPrice = product.discountedPrice ? Number(product.discountedPrice) : Number(product.price)
          }
          return {
            productId: item.productId,
            sizeVariantId: item.sizeVariantId || null,
            sizeName: item.sizeName || null,
            quantity: item.quantity,
            unitPrice: unitPrice,
          }
        }),
      },
    },
  })

  return {
    orderId: order.id,
    razorpayOrderId: rzpOrder.id,
    amount: total,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID!,
    prefill: {
      name: user.name ?? "",
      contact: phone ?? "",
    },
  }
}

// ── STEP 2: Verify Razorpay signature ─────────────────────────────────────────

export async function verifyPaymentAction(input: {
  orderId: string
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}) {
  const user = await requireCustomer()

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex")

  if (expected !== input.razorpaySignature)
    throw new Error("Payment verification failed")

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: true },
  })
  if (!order || order.userId !== user.id) throw new Error("Order not found")
  if (order.paymentStatus === "PAID") throw new Error("Order already paid")

  await prisma.$transaction([
    ...order.items.map((item: { productId: string; sizeVariantId: string | null; quantity: number }) =>
      item.sizeVariantId
        ? prisma.sizeVariant.update({
            where: { id: item.sizeVariantId },
            data: { stock: { decrement: item.quantity } },
          })
        : prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          }),
    ),
    prisma.order.update({
      where: { id: input.orderId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        razorpayPayId: input.razorpayPaymentId,
      },
    }),
    ...(order.discountId
      ? [
          prisma.discount.update({
            where: { id: order.discountId },
            data: { usedCount: { increment: 1 } },
          }),
        ]
      : []),
  ])

  return { success: true as const, orderId: order.id }
}
