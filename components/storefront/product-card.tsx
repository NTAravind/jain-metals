"use client"

import Link from "next/link"
import { useCartStore } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Plus } from "lucide-react"
import { toast } from "sonner"

type SizeVariant = {
  id: string
  name: string
  price: number
  discountPercent: number
  discountedPrice?: number | null
  stock: number
}

type Product = {
  id: string
  name: string
  slug: string
  category?: { name: string } | null
  style: string | null
  price: number
  discountedPrice?: number | null
  stock: number
  images: string[]
  weightKg?: number | null
  variants?: SizeVariant[]
}

interface ProductCardProps {
  product: Product
  variant?: "light" | "dark"
}

function getDisplayPrice(product: Product) {
  const variants = product.variants ?? []
  if (variants.length === 0) {
    return {
      displayPrice: product.discountedPrice ?? product.price,
      originalPrice: product.discountedPrice ? product.price : null,
      maxDiscount: product.discountedPrice
        ? Math.round((1 - product.discountedPrice / product.price) * 100)
        : 0,
      hasRange: false,
      minPrice: product.discountedPrice ?? product.price,
      maxPrice: product.price,
    }
  }

  const prices = variants.map((v) => v.discountedPrice ?? v.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const maxDiscount = Math.max(...variants.map((v) => v.discountPercent || 0))
  const hasRange = minPrice !== maxPrice

  // For single effective price, show original
  const minOriginal = Math.min(...variants.map((v) => v.price))

  return {
    displayPrice: minPrice,
    originalPrice: maxDiscount > 0 ? minOriginal : null,
    maxDiscount,
    hasRange,
    minPrice,
    maxPrice,
  }
}

export function ProductCard({ product, variant = "light" }: ProductCardProps) {
  const inStock = (product.variants?.length ?? 0) > 0
    ? product.variants!.some((v) => v.stock > 0)
    : product.stock > 0

  const { displayPrice, originalPrice, maxDiscount, hasRange, minPrice, maxPrice } = getDisplayPrice(product)

  return (
    <div className={`group relative ${variant === "dark" ? "bg-zinc-950 border-white/10" : "bg-white border-black/5"} p-5 flex flex-col border transition-all duration-500 hover:shadow-2xl`}>
      <Link href={`/products/${product.slug}`} className="block flex-1">
        <div className="space-y-6">
          {/* Gallery Image Container */}
          <div className="aspect-[4/5] bg-zinc-50 dark:bg-zinc-900 overflow-hidden relative border border-black/5 dark:border-white/5 transition-all duration-700 ease-out group-hover:border-black/20 dark:group-hover:border-white/20">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover grayscale-[0.3] transition-all duration-1000 ease-out group-hover:grayscale-0 group-hover:scale-110"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center font-serif text-[10px] uppercase tracking-widest ${variant === "dark" ? "text-brand-cream/20" : "text-brand-navy/20"}`}>
                 Foundry Record
              </div>
            )}
            
            {/* Discount Badge */}
            {maxDiscount > 0 && (
              <div className="absolute top-3 right-3 bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] font-bold shadow-2xl">
                {maxDiscount}% Reduction
              </div>
            )}

            {/* Subtle Availability Badge */}
            {!inStock && (
              <div className="absolute inset-0 bg-black/60 dark:bg-zinc-950/80 backdrop-blur-[4px] flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white border-y border-white/20 py-4 px-10">
                  Archived
                </span>
              </div>
            )}

            {/* Quick Action Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-700 flex items-center justify-center opacity-0 group-hover:opacity-100">
               <div className="w-14 h-14 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 flex items-center justify-center rounded-none transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-2xl">
                  <Plus className="w-6 h-6 text-black dark:text-white" />
               </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <span className={`text-[10px] uppercase tracking-[0.3em] font-bold ${variant === "dark" ? "text-white/40" : "text-black/40"}`}>
                  {product.category?.name || "Metals"}
               </span>
               <div className="flex-1 h-[1px] bg-black/5 dark:bg-white/5"></div>
            </div>
            
            <div className="space-y-2">
              <h3 className={`font-serif text-2xl tracking-tighter transition-colors duration-500 ${variant === "dark" ? "text-white opacity-90 group-hover:opacity-100" : "text-black opacity-90 group-hover:opacity-100"}`}>
                {product.name}
              </h3>
              
              <div className="flex items-baseline gap-4 pt-1">
                <p className={`font-sans text-xl font-bold tracking-tight ${variant === "dark" ? "text-white" : "text-black"}`}>
                  {hasRange
                    ? `₹${minPrice.toLocaleString("en-IN")} – ₹${maxPrice.toLocaleString("en-IN")}`
                    : `₹${displayPrice.toLocaleString("en-IN")}`
                  }
                </p>
                {originalPrice && !hasRange && (
                  <span className={`text-xs line-through tracking-wider font-bold ${variant === "dark" ? "text-white/20" : "text-black/20"}`}>
                     ₹{originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>
            
            <p className={`text-[10px] uppercase tracking-[0.3em] font-bold font-sans ${variant === "dark" ? "text-white/30" : "text-black/30"}`}>
               Archival Specimen
            </p>
          </div>
        </div>
      </Link>
    </div>
  )
}
