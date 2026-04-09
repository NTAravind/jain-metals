import { getOrderById } from "@/dal/orders"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderStatusForm } from "@/components/admin/order-status-form"
import { SendMessageButton } from "@/components/admin/send-message-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrderById(id)
  if (!order) notFound()

  const subtotal = Number(order.subtotal)
  const deliveryFee = Number(order.deliveryFee)
  const discountAmount = Number(order.discountAmount)
  const total = Number(order.total)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="text-gray-400 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-black">
          Order #{order.orderNumber.slice(-8)}
        </h1>
        <Badge variant="outline">{order.status}</Badge>
        <Badge variant={order.paymentStatus === "PAID" ? "default" : "secondary"} className="bg-black text-white hover:bg-black">
          {order.paymentStatus}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Customer */}
        <Card className="bg-white border-black/10">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-black">{order.user.name ?? "—"}</p>
            <p className="text-gray-500">{order.user.phone ?? "—"}</p>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card className="bg-white border-black/10">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Delivery Address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-0.5 text-gray-700">
            <p className="font-medium">{order.address.fullName}</p>
            <p>{order.address.phone}</p>
            <p>
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ""}
            </p>
            <p>
              {order.address.city}, {order.address.state} —{" "}
              {order.address.pincode}
            </p>
            <p>{order.address.country}</p>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card className="bg-white border-black/10">
        <CardHeader>
          <CardTitle className="text-sm text-gray-500">
            Items ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-black/10">
                <TableHead className="text-gray-500">Product</TableHead>
                <TableHead className="text-right text-gray-500">Qty</TableHead>
                <TableHead className="text-right text-gray-500">Unit Price</TableHead>
                <TableHead className="text-right text-gray-500">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item: (typeof order.items)[number]) => (
                <TableRow key={item.id} className="border-black/5">
                  <TableCell className="font-medium text-black">
                    {item.product?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-gray-600">{item.quantity}</TableCell>
                  <TableCell className="text-right text-gray-600">
                    ₹{Number(item.unitPrice).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-medium text-black">
                    ₹
                    {(
                      Number(item.unitPrice) * item.quantity
                    ).toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-white border-black/10">
        <CardContent className="pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Delivery</span>
            <span>₹{deliveryFee.toLocaleString("en-IN")}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-black font-medium">
              <span>Discount</span>
              <span>−₹{discountAmount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-2 text-black">
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <OrderStatusForm
          orderId={order.id}
          currentStatus={order.status}
        />
        <SendMessageButton orderId={order.id} />
      </div>
    </div>
  )
}
