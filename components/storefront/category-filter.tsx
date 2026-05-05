"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
  _count: { products: number }
}

interface CategoryFilterProps {
  categories: Category[]
  activeSlug?: string
}

function CategoryFilterContent({ categories, activeSlug }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigate = (slug?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) params.set("category", slug)
    else params.delete("category")
    params.delete("page")
    router.push(`/products?${params.toString()}`)
  }

  return (
    <>
      {/* Desktop: vertical panel - High Contrast Blue */}
      <aside className="hidden md:block w-72 shrink-0 sticky top-32 bg-brand-navy p-8 border border-brand-gold/20 shadow-2xl relative overflow-hidden blue-texture">
        {/* Subtle Gradient Glow for Readability */}
        <div className="absolute inset-0 bg-brand-navy/60 -z-10" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-[50px] -z-10" />

        <div className="space-y-12 relative z-10">
          <div className="space-y-8">
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-brand-gold flex items-center gap-3">
              <span className="w-6 h-[1.5px] bg-brand-gold/40"></span>
              Collections
            </h4>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => navigate(undefined)}
                className={cn(
                  "group flex items-center justify-between text-left py-3.5 transition-all duration-500",
                  !activeSlug
                    ? "text-brand-gold"
                    : "text-brand-cream/80 hover:text-brand-white"
                )}
              >
                <span className="text-xs font-bold uppercase tracking-[0.2em]">All Masterpieces</span>
                {!activeSlug && <div className="w-1.5 h-1.5 rounded-full bg-brand-gold shadow-[0_0_12px_rgba(201,168,76,0.6)]" />}
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat.slug)}
                  className={cn(
                    "group flex items-center justify-between text-left py-3.5 transition-all duration-500 border-t border-brand-gold/10",
                    activeSlug === cat.slug
                      ? "text-brand-gold"
                      : "text-brand-cream/80 hover:text-brand-white"
                  )}
                >
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">{cat.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold font-mono text-brand-cream/50 group-hover:text-brand-cream/70 transition-colors">({cat._count.products})</span>
                    {activeSlug === cat.slug && <div className="w-1.5 h-1.5 rounded-full bg-brand-gold shadow-[0_0_12px_rgba(201,168,76,0.6)]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>



          {/* Sidebar Trust seal */}
          <div className="pt-8 border-t border-brand-gold/20 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/60 font-bold">Official Foundry Seal</p>
          </div>
        </div>
      </aside>

      {/* Mobile: blue scrollable badges */}
      <div className="md:hidden flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-6 px-6 mb-10">
        <button
          onClick={() => navigate(undefined)}
          className={cn(
            "shrink-0 px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all border",
            !activeSlug
              ? "bg-brand-navy border-brand-navy text-brand-gold shadow-lg blue-texture relative overflow-hidden"
              : "bg-white border-brand-brass/10 text-brand-navy/40"
          )}
        >
          <div className="relative z-10">All Gallery</div>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(cat.slug)}
            className={cn(
              "shrink-0 px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all border",
              activeSlug === cat.slug
                ? "bg-brand-navy border-brand-navy text-brand-gold shadow-lg"
                : "bg-white border-brand-brass/10 text-brand-navy/40"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </>
  )
}

export function CategoryFilter({ categories, activeSlug }: CategoryFilterProps) {
  return (
    <Suspense fallback={<div className="hidden md:block w-72 shrink-0 bg-brand-navy p-8" />}>
      <CategoryFilterContent categories={categories} activeSlug={activeSlug} />
    </Suspense>
  )
}
