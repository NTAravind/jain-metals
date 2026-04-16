import { getDeliveryPincodesPaginated, getStateDeliveriesPaginated, getInternationalDeliveriesPaginated, getDistinctPincodeStates } from "@/dal/delivery"
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

  // Fetch distinct states from pincodes (for the smart state dropdown)
  const pincodeStates = tab === "state" ? await getDistinctPincodeStates() : []

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">Delivery Rates</h1>
        <p className="text-black/50 mt-1 font-medium">Configure delivery pricing by pincode, state, or international</p>
      </div>
      <div className="bg-white rounded-3xl border border-black/10 p-8 shadow-xl shadow-black/[0.02]">
        <DeliveryClient 
          pincodes={pincodes}
          stateDeliveries={stateDeliveries}
          internationalDeliveries={internationalDeliveries}
          pincodeStates={pincodeStates}
          pageCount={pages}
          currentPage={page}
          totalCount={total}
          activeTab={tab}
        />
      </div>
    </div>
  )
}