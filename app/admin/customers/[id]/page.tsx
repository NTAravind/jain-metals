import { getCustomerById } from "@/dal/users"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const customer = await getCustomerById(params.id)
  if (!customer) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/customers"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">
          {customer.name ?? customer.phone ?? "Customer"}
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Profile</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Phone: </span>
              {customer.phone ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Name: </span>
              {customer.name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Member since: </span>
              {new Date(customer.createdAt).toLocaleDateString("en-IN")}
            </p>
            <p>
              <span className="text-muted-foreground">Total orders: </span>
              {customer.orders.length}
            </p>
          </CardContent>
        </Card>

        {customer.addresses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Saved Addresses</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              {customer.addresses.map((addr: typeof customer.addresses[number]) => (
                <div key={addr.id} className="border-b pb-2 last:border-0">
                  <p className="font-medium">{addr.fullName}</p>
                  <p className="text-muted-foreground">
                    {addr.line1}, {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Order History</h2>
        {customer.orders.length === 0 ? (
          <p className="text-muted-foreground text-sm">No orders yet.</p>
        ) : (
          customer.orders.map((order: any) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`}>
              <div className="border rounded-xl p-4 hover:bg-muted/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-sm font-medium">
                      #{order.orderNumber.slice(-8)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      {" · "}
                      {order.items.length} item(s)
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="outline">{order.status}</Badge>
                    <p className="font-bold text-sm">
                      ₹{Number(order.total).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
