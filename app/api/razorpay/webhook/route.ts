import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/db"

/**
 * Razorpay Webhook Handler
 * URL to register: https://jainmetals.co.in/api/razorpay/webhook
 *
 * Events handled:
 *  - payment.captured  → mark order PAID + CONFIRMED, decrement stock
 *  - payment.failed    → mark order payment as FAILED
 *  - order.paid        → idempotent fallback (same as payment.captured)
 */

export const runtime = "nodejs"

// Razorpay sends the raw body — we must NOT let Next.js parse it before
// we verify the HMAC. bodyParser must stay off (default for Route Handlers).
export async function POST(req: NextRequest) {
  // 1. Read raw body as text
  const rawBody = await req.text()

  // 2. Get Razorpay signature header
  const signature = req.headers.get("x-razorpay-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  // 3. Verify HMAC-SHA256 using the webhook secret (NOT the API key secret)
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex")

  if (expectedSig !== signature) {
    console.warn("[webhook] Signature mismatch — possible spoofed request")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  // 4. Parse event
  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const eventType: string = event.event
  console.log(`[webhook] Event received: ${eventType}`)

  try {
    if (eventType === "payment.captured" || eventType === "order.paid") {
      await handlePaymentCaptured(event)
    } else if (eventType === "payment.failed") {
      await handlePaymentFailed(event)
    }
    // All other events are acknowledged but ignored
  } catch (err: any) {
    console.error(`[webhook] Error handling ${eventType}:`, err.message)
    // Return 200 anyway so Razorpay doesn't keep retrying on our DB errors
    return NextResponse.json({ received: true, warning: err.message }, { status: 200 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handlePaymentCaptured(event: any) {
  const payment = event.payload?.payment?.entity
  const rzpOrderId: string = payment?.order_id
  const rzpPaymentId: string = payment?.id

  if (!rzpOrderId || !rzpPaymentId) {
    console.warn("[webhook] payment.captured missing order_id or payment id")
    return
  }

  // Find our DB order by Razorpay order ID
  const order = await prisma.order.findFirst({
    where: { razorpayOrderId: rzpOrderId },
    include: { items: true },
  })

  if (!order) {
    console.warn(`[webhook] No order found for razorpayOrderId=${rzpOrderId}`)
    return
  }

  // Idempotency — skip if already marked PAID
  if (order.paymentStatus === "PAID") {
    console.log(`[webhook] Order ${order.id} already PAID — skipping`)
    return
  }

  // Decrement stock + mark PAID in a single transaction
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
          })
    ),
    prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        razorpayPayId: rzpPaymentId,
      },
    }),
    // Increment coupon usage if applicable
    ...(order.discountId
      ? [
          prisma.discount.update({
            where: { id: order.discountId },
            data: { usedCount: { increment: 1 } },
          }),
        ]
      : []),
  ])

  console.log(`[webhook] Order ${order.orderNumber} marked PAID via webhook`)
}

async function handlePaymentFailed(event: any) {
  const payment = event.payload?.payment?.entity
  const rzpOrderId: string = payment?.order_id

  if (!rzpOrderId) return

  const order = await prisma.order.findFirst({
    where: { razorpayOrderId: rzpOrderId },
  })

  if (!order || order.paymentStatus === "PAID") return

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "FAILED" },
  })

  console.log(`[webhook] Order ${order.orderNumber} marked FAILED via webhook`)
}
