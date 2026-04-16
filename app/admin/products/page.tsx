import { getProductsAdminPaginated } from "@/dal/products"
import { getAllCategories } from "@/dal/categories"
import { ProductsClient } from "@/components/admin/products-client"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const search = typeof params?.search === "string" ? params.search : undefined
  const category = typeof params?.category === "string" ? params.category : undefined
  const stock = typeof params?.stock === "string" ? params.stock : undefined

  const [{ products, pages, total }, categories] = await Promise.all([
    getProductsAdminPaginated(page, 10, search, category, stock),
    getAllCategories(),
  ])

  const formattedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    categoryName: p.category?.name ?? null,
    style: p.style,
    price: Number(p.price),
    stock: p.stock,
    isActive: p.isActive,
  }))

  return (
    <ProductsClient 
       products={formattedProducts}
       categories={categories}
       pageCount={pages}
       currentPage={page}
       totalCount={total}
       activeCategory={category}
       activeStock={stock}
    />
  )
}
