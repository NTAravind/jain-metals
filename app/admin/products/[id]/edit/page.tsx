import { ProductForm } from "@/components/admin/product-form"
import { getProductByIdAdmin } from "@/dal/products"
import { getAllCategories } from "@/dal/categories"
import { notFound } from "next/navigation"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProductByIdAdmin(id),
    getAllCategories(),
  ])

  if (!product) {
    notFound()
  }

  const serializedProduct = product ? {
    ...product,
    price: Number(product.price),
    discountedPrice: product.discountedPrice ? Number(product.discountedPrice) : null,
    variants: product.variants?.map((v: any) => ({
      ...v,
      price: Number(v.price),
      discountedPrice: v.discountedPrice ? Number(v.discountedPrice) : null,
    })) ?? [],
  } : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Edit Product</h1>
        <p className="text-gray-500 mt-1">
          Update an existing product listing.
        </p>
      </div>
      <div className="bg-white rounded-lg border border-black/10 p-6">
        <ProductForm product={serializedProduct} categories={categories} />
      </div>
    </div>
  )
}
