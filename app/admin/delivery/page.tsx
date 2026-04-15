import { getDeliveryPincodesPaginated, getStateDeliveriesPaginated, getInternationalDeliveriesPaginated } from "@/dal/delivery"
import { DeliveryClient } from "@/components/admin/delivery-client"

export default async function AdminDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const tab = typeof params?.tab === "string" ? params.tab : "pincode"
  const search = typeof params?.search === "string" ? params.search : undefined

  let pincodes: any[] = []
  let stateDeliveries: any[] = []
  let internationalDeliveries: any[] = []
  let pages = 1
  let total = 0

  if (tab === "pincode") {
    const result = await getDeliveryPincodesPaginated(page, 10, search)
    pincodes = result.pincodes
    pages = result.pages
    total = result.total
  } else if (tab === "state") {
    const result = await getStateDeliveriesPaginated(page, 10, search)
    stateDeliveries = result.states
    pages = result.pages
    total = result.total
  } else if (tab === "international") {
    const result = await getInternationalDeliveriesPaginated(page, 10, search)
    internationalDeliveries = result.countries
    pages = result.pages
    total = result.total
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">Delivery Rates</h1>
        <p className="text-black/50 dark:text-white/50 mt-1 font-medium">Configure delivery pricing by pincode, state, or international</p>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/10 dark:border-white/10 p-8 shadow-xl shadow-black/[0.02] dark:shadow-white/[0.02]">
        <DeliveryClient 
          pincodes={pincodes}
          stateDeliveries={stateDeliveries}
          internationalDeliveries={internationalDeliveries}
          pageCount={pages}
          currentPage={page}
          totalCount={total}
          activeTab={tab}
        />
      </div>
    </div>
  )
}