import { notFound } from "next/navigation"
import { getCollectionBySlug, serializeCollectionProduct } from "@/dal/collections"
import { ProductCard } from "@/components/storefront/product-card"
import { StorefrontLayout } from "@/components/storefront/storefront-layout"
import { Layers } from "lucide-react"

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const collection = await getCollectionBySlug(id)
  if (!collection) return { title: "Collection Not Found" }
  return {
    title: `${collection.name} | Jain Metals`,
    description: collection.description ?? `Browse our ${collection.name} collection at Jain Metals.`,
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const collection = await getCollectionBySlug(id)

  if (!collection) notFound()

  const products = collection.products.map(serializeCollectionProduct)

  return (
    <StorefrontLayout>
      {/* Hero Header */}
      <header className="pt-48 pb-32 px-8 text-center section-dark blue-texture relative border-b border-brand-gold/30 overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-10 relative z-10">
          <div className="flex items-center justify-center gap-8">
            <div className="w-16 h-[1px] bg-brand-gold/40" />
            <span className="text-xs uppercase tracking-[0.4em] font-bold text-brand-gold whitespace-nowrap">
              Collection
            </span>
            <div className="w-16 h-[1px] bg-brand-gold/40" />
          </div>

          <h1 className="text-6xl md:text-9xl font-serif text-brand-cream tracking-tighter leading-none">
            {collection.name}
          </h1>

          {collection.description && (
            <div className="flex justify-center">
              <p className="text-base text-brand-cream/70 font-sans max-w-2xl leading-relaxed border-l-2 border-brand-gold/30 pl-10 text-left">
                {collection.description}
              </p>
            </div>
          )}

          {collection.discountPercent != null && collection.discountPercent > 0 && (
            <div className="inline-flex items-center gap-3 border border-brand-gold/40 px-6 py-3 text-brand-gold">
              <span className="text-2xl font-bold font-serif">{collection.discountPercent}% OFF</span>
              <span className="text-xs uppercase tracking-[0.3em] opacity-70">on all items</span>
            </div>
          )}
        </div>
      </header>

      {/* Products Grid */}
      <main className="max-w-[1440px] white-pattern mx-auto px-8 md:px-12 py-24">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-48 gap-6 text-brand-navy/30 border border-dashed border-brand-navy/10">
            <Layers className="w-16 h-16" />
            <div className="text-center space-y-2">
              <h3 className="font-serif text-4xl text-brand-navy mb-2 tracking-tight">Empty Collection</h3>
              <p className="text-xs uppercase tracking-[0.2em] font-bold">Products coming soon</p>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Status bar */}
            <div className="flex items-center justify-between border-b border-brand-navy pb-10">
              <div className="flex items-center gap-6">
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy">Products</p>
                <span className="w-9 h-9 rounded-full border border-brand-gold flex items-center justify-center text-xs font-bold text-brand-gold">
                  {products.length}
                </span>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          </div>
        )}
      </main>
    </StorefrontLayout>
  )
}
