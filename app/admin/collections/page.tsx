import { getAllCollectionsAdmin } from "@/dal/collections"
import { CollectionsClient } from "@/components/admin/collections-client"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function AdminCollectionsPage() {
  const collections = await getAllCollectionsAdmin()

  // Build a preview map: collectionId → first-4 products' images
  const productsByCollection: Record<string, { images: string[] }[]> = {}

  for (const col of collections) {
    const pcs = await prisma.productCollection.findMany({
      where: { collectionId: col.id },
      take: 4,
      include: { product: { select: { images: true } } },
    })
    productsByCollection[col.id] = pcs.map((pc: any) => ({ images: pc.product.images }))
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-black tracking-tight">Collections</h1>
        <p className="text-sm text-black/40">
          Curate product groupings, set collection-level discounts, and manage what appears in the storefront.
        </p>
      </div>
      <CollectionsClient
        collections={collections as any}
        productsByCollection={productsByCollection}
      />
    </div>
  )
}
