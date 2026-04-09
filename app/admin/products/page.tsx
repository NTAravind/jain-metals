import { getAllProductsAdmin } from "@/dal/products"
import { ProductsClient } from "@/components/admin/products-client"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  const products = await getAllProductsAdmin()

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
    <ProductsClient products={formattedProducts} />
  )
}
