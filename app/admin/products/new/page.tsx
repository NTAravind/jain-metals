import { ProductForm } from "@/components/admin/product-form"
import { getAllCategories } from "@/dal/categories"

export default async function NewProductPage() {
  const categories = await getAllCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Add New Product</h1>
        <p className="text-gray-500 mt-1">
          Create a new product listing in the catalog.
        </p>
      </div>
      <div className="bg-white rounded-lg border border-black/10 p-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  )
}
