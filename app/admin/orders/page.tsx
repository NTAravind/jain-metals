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
    id: order.id,
    orderNumber: order.orderNumber,
    user: order.user,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: Number(order.total),
    createdAt: order.createdAt,
    // OrdersTable only needs product images. Do not pass Prisma Decimal fields
    // (such as item.unitPrice or discount.value) into this Client Component.
    items: order.items.map((item) => ({
      product: {
        images: item.product.images,
      },
    })),
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
