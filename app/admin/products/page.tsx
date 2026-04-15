import { getProductsAdminPaginated } from "@/dal/products"
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

  const { products, pages, total } = await getProductsAdminPaginated(page, 10, search)

  // Map exactly what ProductsClient expects + resolve null categoryId to string | null
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
       pageCount={pages}
       currentPage={page}
       totalCount={total}
    />
  )
}
