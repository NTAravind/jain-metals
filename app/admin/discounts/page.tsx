import { getProductsWithDiscounts } from "@/dal/products"
import { getAllCategories } from "@/dal/categories"
import { ProductDiscountsClient } from "@/components/admin/product-discounts-client"

export default async function AdminDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const tab = typeof params?.tab === "string" ? params.tab : "products"
  const search = typeof params?.search === "string" ? params.search : undefined
  const categoryFilter = typeof params?.category === "string" ? params.category : undefined

  const [{ products, total, pages }, categories] = await Promise.all([
    getProductsWithDiscounts(page, 10, search, categoryFilter),
    getAllCategories(),
  ])

  // Serialize Decimal values
  const serializedProducts = products.map((p: any) => ({
    ...p,
    price: Number(p.price),
    discountedPrice: p.discountedPrice ? Number(p.discountedPrice) : null,
    variants: p.variants?.map((v: any) => ({
      ...v,
      price: Number(v.price),
      discountedPrice: v.discountedPrice ? Number(v.discountedPrice) : null,
    })) ?? [],
  }))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">Discounts</h1>
        <p className="text-black/50 mt-1 font-medium">
          Set sale prices on individual products or apply bulk discounts by category
        </p>
      </div>
      <div className="bg-white rounded-3xl border border-black/10 p-8 shadow-xl shadow-black/[0.02]">
        <ProductDiscountsClient
          products={serializedProducts}
          categories={categories}
          pageCount={pages}
          currentPage={page}
          totalCount={total}
          activeTab={tab}
          activeCategoryFilter={categoryFilter}
        />
      </div>
    </div>
  )
}
