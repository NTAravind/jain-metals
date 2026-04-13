import { getAllDeliveryPincodes } from "@/dal/delivery"
import { DeliveryClient } from "@/components/admin/delivery-client"

export default async function AdminDeliveryPage() {
  const pincodes = await getAllDeliveryPincodes()
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">Delivery Rates</h1>
        <p className="text-black/50 dark:text-white/50 mt-1 font-medium">Configure pincode-wise delivery pricing</p>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/10 dark:border-white/10 p-8 shadow-xl shadow-black/[0.02] dark:shadow-white/[0.02]">
        <DeliveryClient pincodes={pincodes} />
      </div>
    </div>
  )
}