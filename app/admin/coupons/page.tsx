import { getDiscountsPaginated } from "@/dal/discounts"
import { DiscountsClient } from "@/components/admin/discounts-client"

export default async function AdminDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const search = typeof params?.search === "string" ? params.search : undefined
  const type = typeof params?.type === "string" ? params.type : undefined
  const active = typeof params?.active === "string" ? params.active : undefined

  const { discounts, pages, total } = await getDiscountsPaginated(page, 10, search, type, active)
  const serializedDiscounts = discounts.map((d) => ({
    ...d,
    value: Number(d.value),
    minOrderValue: d.minOrderValue ? Number(d.minOrderValue) : null,
  }))
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">Coupons</h1>
        <p className="text-black/50 mt-1 font-medium">Create and manage discount coupon codes for checkout</p>
      </div>
      <div className="bg-white rounded-3xl border border-black/10 p-8 shadow-xl shadow-black/[0.02]">
        <DiscountsClient 
           discounts={serializedDiscounts} 
           pageCount={pages}
           currentPage={page}
           totalCount={total}
           activeType={type}
           activeActive={active}
        />
      </div>
    </div>
  )
}
