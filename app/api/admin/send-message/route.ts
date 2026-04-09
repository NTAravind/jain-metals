import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-guards"
import { getOrderById } from "@/dal/orders"
import { AuthError } from "@/lib/auth-guards"

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: "Unauthorized" }, { status: e.statusCode })
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { orderId } = await req.json()
  const order = await getOrderById(orderId)
  if (!order)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const phone = order.user.phone
  const message = `Dear ${order.user.name ?? "Customer"}, your Jain Metals order #${order.orderNumber} is now: ${order.status}. Total: ₹${order.total}`
  console.log(`[send-message] To: ${phone} | ${message}`)
  // Plug in Twilio / WhatsApp Business API here

  return NextResponse.json({ success: true })
}
