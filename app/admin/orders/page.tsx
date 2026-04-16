import { getOrdersPaginated } from "@/dal/orders"
import { OrdersTable } from "@/components/admin/orders-table"

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const search = typeof params?.search === "string" ? params.search : undefined
  const status = typeof params?.status === "string" ? params.status : undefined

  const { orders, pages, total } = await getOrdersPaginated(page, 10, search, status)

  const serializedOrders = orders.map((order) => ({
    ...order,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    discountAmount: Number(order.discountAmount),
    total: Number(order.total),
  }))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">Order Ledger</h1>
        <p className="text-black/50 mt-1 font-medium">Track and fulfill customer acquisitions</p>
      </div>
      <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-xl shadow-black/[0.02]">
        <OrdersTable 
           orders={serializedOrders} 
           pageCount={pages}
           currentPage={page}
           totalCount={total}
           activeStatus={status}
        />
      </div>
    </div>
  )
}
