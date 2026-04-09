import { NextResponse } from "next/server"

// Deprecated — checkout is now handled via Server Actions in actions/checkout.ts
export async function POST() {
  return NextResponse.json({ error: "Deprecated endpoint" }, { status: 410 })
}