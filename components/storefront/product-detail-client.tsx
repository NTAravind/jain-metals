"use client"

import { useState } from "react"
import { useCartStore } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Share2, Ruler, Weight, ArrowRight, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

type SizeVariant = {
  id: string
  name: string
  price: number
  discountPercent: number
  discountedPrice?: number | null
  stock: number
  sortOrder: number
}

export function ProductDetailClient({ product }: { product: any }) {
  const hasVariants = product.variants && product.variants.length > 0
  const [selectedVariant, setSelectedVariant] = useState<SizeVariant | null>(
    hasVariants ? product.variants[0] : null
  )
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(product.images?.[0] || null)
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()

  // Derived pricing
  const activePrice = selectedVariant
    ? (selectedVariant.discountedPrice ?? selectedVariant.price)
    : (product.discountedPrice ?? product.price)

  const originalPrice = selectedVariant
    ? (selectedVariant.discountedPrice ? selectedVariant.price : null)
    : (product.discountedPrice ? product.price : null)

  const discountPercent = selectedVariant
    ? (selectedVariant.discountPercent || 0)
    : (product.discountedPrice ? Math.round((1 - product.discountedPrice / product.price) * 100) : 0)

  const currentStock = selectedVariant ? selectedVariant.stock : product.stock
  const outOfStock = currentStock === 0

  // Reset quantity when variant changes
  const handleVariantChange = (variant: SizeVariant) => {
    setSelectedVariant(variant)
    setQuantity(1)
  }

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      sizeVariantId: selectedVariant?.id ?? null,
      sizeVariantName: selectedVariant?.name ?? null,
      quantity,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(activePrice),
        discountedPrice: originalPrice ? Number(activePrice) : null,
        stock: currentStock,
        images: product.images,
        weightKg: product.weightKg,
      },
    })
    toast.success(`Added "${product.name}${selectedVariant ? ` (${selectedVariant.name})` : ''}" to cart`)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    router.push("/checkout")
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    }
  }

  return (
    <div className="storefront bg-white dark:bg-zinc-950 min-h-screen">
      {/* 1. VISUAL NARRATIVE & PRIMARY INFO: Section White */}
      <section className="section-white relative border-b border-black/5 dark:border-white/5 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-full bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.03)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]"></div>
        
        <div className="max-w-[1440px] mx-auto px-8 md:px-12 py-32 flex flex-col lg:flex-row gap-24 xl:gap-32 relative z-10">
          
          {/* Left: The Artifact Gallery */}
          <div className="lg:w-[55%] space-y-12">
            <div className="aspect-[4/5] bg-brand-surface relative overflow-hidden card-premium-light border-0 group">
               {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-full object-cover grayscale-[0.2] transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105"
                  />
               ) : (
                   <div className="w-full h-full flex items-center justify-center text-[11px] uppercase tracking-[0.5em] font-bold text-brand-navy/10 italic">
                     Image Unavailable
                   </div>
               )}
               
                {!outOfStock && currentStock < 5 && (
                   <div className="absolute top-10 left-10 bg-brand-navy text-brand-gold border border-brand-gold/20 px-8 py-4 text-[10px] uppercase tracking-[0.4em] font-bold shadow-2xl">
                      Limited Stock
                   </div>
                )}

                {/* Discount Badge */}
                {discountPercent > 0 && (
                  <div className="absolute top-10 right-10 bg-red-600 text-white px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-bold shadow-2xl">
                    {discountPercent}% Off
                  </div>
                )}
            </div>

            {/* Thumbnails (Archival Strip) */}
            {product.images?.length > 1 && (
              <div className="flex gap-8 overflow-x-auto pb-6 scrollbar-hide">
                {product.images.map((img: string, idx: number) => (
                   <button
                     key={idx}
                     onClick={() => setActiveImage(img)}
                     className={cn(
                       "relative w-32 h-32 flex-shrink-0 transition-all duration-700 bg-brand-white border-2",
                       activeImage === img 
                        ? "border-brand-gold ring-4 ring-brand-gold/5" 
                        : "border-transparent opacity-40 hover:opacity-100 hover:border-brand-brass/20"
                     )}
                   >
                     <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all" />
                   </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: The Registry Detail */}
          <div className="lg:w-[45%]">
            <div className="sticky top-40 space-y-10">
              {/* Product Name */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-brand-gold">{product.category?.name || "Brass & Copper"}</span>
                </div>
                <h1 className="text-4xl xl:text-5xl font-serif text-brand-navy tracking-tighter leading-[1]">
                  {product.name}
                </h1>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-4">
                  <p className="text-4xl font-bold text-brand-navy tracking-tight">
                    ₹{Number(activePrice).toLocaleString("en-IN")}
                  </p>
                  {originalPrice && (
                    <span className="text-xl text-brand-navy/30 line-through font-sans">
                      ₹{Number(originalPrice).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                {discountPercent > 0 && (
                  <span className="inline-block text-xs font-bold text-red-600 bg-red-50 px-3 py-1 uppercase tracking-widest">
                    {discountPercent}% Off
                  </span>
                )}
              </div>

              {/* Variant Selector */}
              {hasVariants && (
                <div className="space-y-4">
                  <p className="text-[11px] uppercase tracking-[0.4em] font-bold text-brand-navy/50">
                    Select Size
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((v: SizeVariant) => {
                      const isSelected = selectedVariant?.id === v.id
                      const variantOutOfStock = v.stock === 0
                      const vPrice = v.discountedPrice ?? v.price
                      return (
                        <button
                          key={v.id}
                          onClick={() => !variantOutOfStock && handleVariantChange(v)}
                          disabled={variantOutOfStock}
                          className={cn(
                            "relative border-2 px-5 py-3.5 transition-all duration-300 min-w-[100px]",
                            isSelected
                              ? "border-brand-gold bg-brand-gold/5 ring-2 ring-brand-gold/10"
                              : "border-brand-brass/15 hover:border-brand-gold/40 bg-white",
                            variantOutOfStock && "opacity-40 cursor-not-allowed line-through"
                          )}
                        >
                          <span className={cn(
                            "block text-[13px] font-bold tracking-wide",
                            isSelected ? "text-brand-navy" : "text-brand-navy/70"
                          )}>
                            {v.name}
                          </span>
                          <span className={cn(
                            "block text-[12px] mt-1 font-medium",
                            isSelected ? "text-brand-gold" : "text-brand-navy/40"
                          )}>
                            ₹{Number(vPrice).toLocaleString("en-IN")}
                          </span>
                          {variantOutOfStock && (
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-[0.2em] font-bold text-brand-navy/40 bg-white/60">
                              Sold Out
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantity & Stock */}
              {!outOfStock && (
                <div className="flex items-center justify-between py-4 border-y border-brand-brass/10">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-brand-navy/40">Quantity</p>
                    <p className="text-sm font-bold text-brand-gold">{currentStock} in stock</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white border border-brand-brass/10">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-brand-navy/30 hover:text-brand-gold transition-colors text-2xl font-light"
                      disabled={quantity <= 1}
                    >−</button>
                    <span className="w-12 text-center font-bold text-brand-navy text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="w-10 h-10 flex items-center justify-center text-brand-navy/30 hover:text-brand-gold transition-colors text-2xl font-light"
                      disabled={quantity >= currentStock}
                    >+</button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!outOfStock ? (
                <div className="flex flex-col gap-4">
                  <Button
                    onClick={handleBuyNow}
                    size="lg"
                    className="w-full h-14 bg-brand-navy text-brand-white hover:bg-brand-gold transition-all duration-500 rounded-none uppercase tracking-[0.3em] text-xs font-bold shadow-lg group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      Buy Now <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </span>
                  </Button>
                  <Button
                    onClick={handleAddToCart}
                    variant="outline"
                    className="w-full h-14 border-2 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white transition-all duration-500 rounded-none uppercase tracking-[0.3em] text-xs font-bold"
                  >
                    Add to Cart
                  </Button>
                </div>
              ) : (
                <div className="p-8 bg-brand-navy text-center space-y-4">
                  <p className="font-serif text-xl text-brand-cream">Out of Stock</p>
                  <p className="text-brand-cream/50 text-sm">
                    Contact us to place a special order
                  </p>
                  <Button variant="outline" className="w-full border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 rounded-none uppercase tracking-widest text-xs h-12">
                    Contact Us
                  </Button>
                </div>
              )}

              {/* Quick Specs */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-brand-brass/10">
                <div className="flex items-center gap-3">
                  <Ruler className="w-4 h-4 text-brand-gold/50" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-navy/30">Height</p>
                    <p className="font-bold text-brand-navy">{product.heightCm ? `${product.heightCm} cm` : "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Weight className="w-4 h-4 text-brand-gold/50" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-navy/30">Weight</p>
                    <p className="font-bold text-brand-navy">{product.weightKg ? `${product.weightKg} kg` : "—"}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.5em] font-bold text-brand-navy/50">Description</h3>
                <p className="text-brand-navy/70 leading-relaxed">
                  {product.description || "A beautifully crafted piece made with care. Perfect for your home or as a gift."}
                </p>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-center gap-8 pt-4 border-t border-brand-brass/10">
                <button onClick={handleShare} className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-brand-navy/40 hover:text-brand-gold transition-colors">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-brand-navy/40 hover:text-brand-gold transition-colors">
                  <MessageSquare className="w-4 h-4" /> Help
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TECHNICAL SPECIFICATIONS: Section Dark */}
      <section className="section-dark py-32 relative overflow-hidden">
         <div className="absolute inset-0 floral-texture opacity-10"></div>
         <div className="max-w-[1440px] mx-auto px-8 md:px-12 relative z-10 grid lg:grid-cols-3 gap-20">
            <div className="lg:col-span-1 space-y-8">
               <h2 className="text-4xl md:text-5xl font-serif text-brand-cream tracking-tighter">Product <br /> Details</h2>
               <div className="h-1 w-24 bg-brand-gold"></div>
               <p className="text-brand-cream/40 leading-relaxed font-sans text-lg">
                  Everything you need to know about this product. Handcrafted with care.
               </p>
            </div>

            <div className="lg:col-span-2 grid md:grid-cols-2 gap-10">
               {[
                 { label: "Material", value: product.material || "Brass", detail: "Quality crafted." },
                 { label: "Weight", value: `${product.weightKg || 'N/A'} kg`, detail: "As listed." },
                 { label: "Height", value: `${product.heightCm || 'N/A'} cm`, detail: "Standing height." },
                 { label: "Availability", value: currentStock > 0 ? "In Stock" : "Out of Stock", detail: currentStock > 0 ? `${currentStock} available` : "Contact us" }
               ].map((spec) => (
                 <div key={spec.label} className="card-premium-dark p-10 space-y-6 group">
                    <div className="space-y-1">
                       <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-gold opacity-60">{spec.label}</p>
                       <p className="text-2xl font-serif text-brand-white group-hover:text-brand-gold transition-colors">{spec.value}</p>
                    </div>
                    <p className="text-[11px] text-brand-cream/30 uppercase tracking-[0.4em] font-bold">{spec.detail}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>
    </div>
  )
}
