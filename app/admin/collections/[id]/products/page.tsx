import { notFound } from "next/navigation"
import { getCollectionAdminById } from "@/dal/collections"
import { getAllProductsAdmin } from "@/dal/products"
import { CollectionProductsClient } from "@/components/admin/collection-products-client"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CollectionProductsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [collection, allProductsRaw] = await Promise.all([
    getCollectionAdminById(id),
    getAllProductsAdmin(),
  ])

  if (!collection) notFound()

  const allProducts = allProductsRaw.map((p: any) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    images: p.images,
    price: Number(p.price),
    discountedPrice: p.discountedPrice ? Number(p.discountedPrice) : null,
    category: p.category ? { name: p.category.name } : null,
    stock: p.stock,
    isActive: p.isActive,
  }))

  const currentIds = collection.products.map((pc: any) => pc.productId)

  const collectionData = {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    isDefault: collection.isDefault,
    discountPercent: collection.discountPercent,
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/collections"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Collections
        </Link>
        <span className="text-black/20">/</span>
        <span className="text-xs font-bold uppercase tracking-widest text-black">{collection.name}</span>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-black tracking-tight">
          {collection.name}
        </h1>
        <p className="text-sm text-black/40">
          Edit collection settings and manage which products belong to it.
        </p>
      </div>

      <CollectionProductsClient
        collection={collectionData}
        allProducts={allProducts}
        currentIds={currentIds}
      />
    </div>
  )
}
