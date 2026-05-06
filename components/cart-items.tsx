"use client"

import { useCartStore } from "@/store/cart"
import { cn } from "@/lib/utils"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"

interface CartItemsProps {
  readonly?: boolean
}

export function CartItems({ readonly = false }: CartItemsProps) {
  const { items, updateQuantity, removeItem } = useCartStore()

  /* ── Empty State ── */
  if (items.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 select-none">
        <div className="w-16 h-16 rounded-full bg-brand-navy/5 flex items-center justify-center">
          <ShoppingBag className="w-7 h-7 text-brand-navy/20" strokeWidth={1.25} />
        </div>
        <div className="text-center space-y-1.5">
          <p className="font-serif italic text-lg text-brand-navy/60">
            Your gallery is empty
          </p>
          <p className="text-[12px] tracking-[0.18em] uppercase text-brand-navy/40 font-semibold italic">
            Discover sacred artworks
          </p>
        </div>
      </div>
    )
  }

  /* ── Item Cards ── */
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const price = item.product.discountedPrice ?? item.product.price
        const originalPrice = item.product.discountedPrice ? item.product.price : null
        const lineTotal = price * item.quantity
        const nearStock = item.product.stock <= 3
        const itemId = item.sizeVariantId
          ? `${item.productId}::${item.sizeVariantId}`
          : item.productId

        return (
          <div
            key={itemId}
            className={cn(
              "flex gap-3 sm:gap-3.5 p-3 sm:p-3.5 bg-white border border-brand-brass/15 shadow-sm",
              readonly ? "flex-row" : "flex-col sm:flex-row",
            )}
          >
            {/* ── Thumbnail ── */}
            <div
              className={cn(
                "relative shrink-0 bg-[#F7F3EC] border border-brand-brass/10 overflow-hidden",
                readonly ? "w-[72px] sm:w-[80px] h-[72px] sm:h-[80px]" : "w-full sm:w-[80px] h-[120px] sm:h-[80px]",
              )}
            >
              {item.product.images?.[0] ? (
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-brand-navy/15" strokeWidth={1} />
                </div>
              )}
            </div>

            {/* ── Details ── */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                {/* Name */}
                <h4 className="font-serif text-brand-navy text-sm sm:text-[17px] leading-snug line-clamp-2 mb-0.5 tracking-wide">
                  {item.product.name}
                </h4>

                {/* Size variant label */}
                {item.sizeVariantName && (
                  <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.12em] sm:tracking-[0.15em] uppercase text-brand-gold/80 mb-1.5">
                    {item.sizeVariantName}
                  </p>
                )}

                {/* Price */}
                <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <span className="text-brand-brass text-sm sm:text-[14px] font-bold tracking-wide">
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                  {originalPrice && (
                    <span className="text-brand-navy/30 text-xs sm:text-[12px] line-through font-serif italic">
                      ₹{originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                  {nearStock && !readonly && (
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.08em] uppercase text-amber-700 ml-1.5">
                      {item.product.stock} left
                    </span>
                  )}
                </div>
              </div>

              {!readonly ? (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Qty stepper */}
                  <div className="flex items-center border border-brand-brass/20 bg-[#F7F3EC]">
                    <button
                      onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1), item.sizeVariantId)}
                      disabled={item.quantity <= 1}
                      className="w-7 h-7 flex items-center justify-center text-brand-navy/40 hover:text-brand-navy hover:bg-brand-brass/10 disabled:opacity-20 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-[10px] h-[10px]" />
                    </button>
                    <span className="w-8 text-center text-sm sm:text-[14px] font-bold text-brand-navy tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, Math.min(item.product.stock, item.quantity + 1), item.sizeVariantId)}
                      disabled={item.quantity >= item.product.stock}
                      className="w-8 h-8 flex items-center justify-center text-brand-navy/40 hover:text-brand-navy hover:bg-brand-brass/10 disabled:opacity-20 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-[11px] h-[11px]" />
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId, item.sizeVariantId)}
                    className="w-8 h-8 flex items-center justify-center text-brand-navy/25 hover:text-red-600 transition-colors"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>

                  {/* Line total */}
                  <span className="ml-auto font-serif text-base sm:text-[17px] font-bold text-brand-navy tabular-nums">
                    ₹{lineTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-[12px] font-semibold tracking-[0.1em] sm:tracking-[0.12em] uppercase text-brand-navy/40">
                    Piece Count {item.quantity}
                  </span>
                  <span className="font-serif text-base sm:text-[17px] font-bold text-brand-navy tabular-nums">
                    ₹{lineTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
