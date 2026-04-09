import { getProducts } from "@/dal/products"
import { getAllCategories } from "@/dal/categories"
import { ProductCard } from "@/components/storefront/product-card"
import { Pagination } from "@/components/storefront/pagination"
import { CategoryFilter } from "@/components/storefront/category-filter"
import { Suspense } from "react"

export const revalidate = 60

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; q?: string }>
}) {
  const { page: pageParam, category: categorySlug, q } = await searchParams

  const page = Math.max(1, Number(pageParam ?? 1))

  const [{ products, pages }, categories] = await Promise.all([
    getProducts(page, 12, categorySlug, q),
    getAllCategories(),
  ])

  const activeCategory = categories.find((c) => c.slug === categorySlug)

  return (
    <div className="bg-white min-h-screen storefront">
      {/* 1. ARCHIVAL HEADER: Premium Navy + Gold Floral Registry */}
      <header className="pt-48 pb-32 px-8 text-center section-dark blue-texture relative border-b border-brand-gold/30 overflow-hidden">
        {/* Deep navy accent layer */}

 
        <div className="max-w-4xl mx-auto space-y-10 relative z-10">
          <div className="flex items-center justify-center gap-8">
            <div className="w-16 h-[1px] bg-brand-gold/40"></div>
            <span className="text-xs uppercase tracking-[0.4em] font-bold text-brand-gold whitespace-nowrap">Shop</span>
            <div className="w-16 h-[1px] bg-brand-gold/40"></div>
          </div>

          <h1 className="text-6xl md:text-9xl font-serif text-brand-cream tracking-tighter leading-none">
            {activeCategory ? activeCategory.name : "Our Products"}
          </h1>

          <div className="flex justify-center">
            <p className="text-base text-brand-cream/70 font-sans max-w-2xl leading-relaxed border-l-2 border-brand-gold/30 pl-10 text-left">
              {activeCategory
                ? `Explore our beautiful ${activeCategory.name} collection. Handcrafted with care and delivered to your home.`
                : "Browse our handpicked collection of brass idols, copper utensils, and home decor. Quality products at fair prices since 1964."}
            </p>
          </div>
        </div>
      </header>

      {/* 2. REGISTRY GRID: High Contrast Layout */}
      <main className="max-w-[1440px] white-pattern  mx-auto px-8 md:px-12 py-24">
        <div className="flex flex-col lg:flex-row gap-24">
          {/* Industrial Sidebar Filter */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="sticky top-40 space-y-12">
              <CategoryFilter categories={categories as any} activeSlug={categorySlug} />

              {/* B2B Trust Badge in Sidebar */}
              <div className="p-8 bg-brand-navy text-brand-cream border border-brand-gold/20 space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold">Why Shop With Us</p>
                <p className="text-sm leading-relaxed font-sans opacity-60">
                  Quality products, fair prices, and reliable delivery. We're here to help you find exactly what you need.
                </p>
              </div>
            </div>
          </aside>

          {/* Product Gallery Grid */}
          <div className="flex-1 min-w-0">
            {products.length === 0 ? (
              <div className="text-center py-48 border border-dashed border-brand-brass/20 bg-brand-cream/[0.03]">
                <h3 className="font-serif text-4xl text-brand-navy mb-6 tracking-tight">No Products Found</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-brand-navy/50 font-bold max-w-xs mx-auto">
                  We're adding new products. Check back soon!
                </p>
              </div>
            ) : (
              <div className="space-y-24">
                {/* Refined Status Bar */}
                <div className="flex items-center justify-between border-b border-brand-navy pb-10">
                  <div className="flex items-center gap-6">
                    <p className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy">
                      Products
                    </p>
                    <span className="w-9 h-9 rounded-full border border-brand-gold flex items-center justify-center text-xs font-bold text-brand-gold">
                      {products.length}
                    </span>
                  </div>
                  {q && (
                    <div className="flex items-center gap-3 px-6 py-2 bg-brand-gold/10 border border-brand-gold/20 rounded-sm">
                      <span className="text-xs uppercase tracking-[0.2em] font-bold text-brand-gold">Search: "{q}"</span>
                    </div>
                  )}
                </div>

                {/* Grid with Premium Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
                  ))}
                </div>

                {/* Pagination (Structured) */}
                {pages > 1 && (
                  <div className="pt-24 border-t border-brand-brass/20 flex justify-center">
                    <Pagination currentPage={page} totalPages={pages} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

