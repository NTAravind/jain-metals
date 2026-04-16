import { getCustomersPaginated } from "@/dal/users"
import { CustomersClient } from "@/components/admin/customers-client"

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const search = typeof params?.search === "string" ? params.search : undefined
  const hasOrders = typeof params?.hasOrders === "string" ? params.hasOrders : undefined

  const { customers, pages, total } = await getCustomersPaginated(page, 10, search, hasOrders)
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">Customer Ledger</h1>
        <p className="text-black/50 mt-1 font-medium">Directory of established patrons and acquisitions</p>
      </div>
      <div className="bg-white rounded-3xl border border-black/10 p-8 shadow-xl shadow-black/[0.02]">
        <CustomersClient 
           customers={customers} 
           pageCount={pages}
           currentPage={page}
           totalCount={total}
           activeHasOrders={hasOrders}
        />
      </div>
    </div>
  )
}
