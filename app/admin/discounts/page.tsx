import { getAllDiscounts } from "@/dal/discounts"
import { DiscountsClient } from "@/components/admin/discounts-client"

export default async function AdminDiscountsPage() {
  const discounts = await getAllDiscounts()
  const serializedDiscounts = discounts.map((d) => ({
    ...d,
    value: Number(d.value),
    minOrderValue: d.minOrderValue ? Number(d.minOrderValue) : null,
  }))
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">Privilege Keys</h1>
        <p className="text-black/50 mt-1 font-medium">Configure and oversight promotional value codes</p>
      </div>
      <div className="bg-white rounded-3xl border border-black/10 p-8 shadow-xl shadow-black/[0.02]">
        <DiscountsClient discounts={serializedDiscounts} />
      </div>
    </div>
  )
}
