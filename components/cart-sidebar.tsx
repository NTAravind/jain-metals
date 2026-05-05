"use client"

import * as React from "react"
import { useCartStore } from "@/store/cart"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { CartItems } from "@/components/cart-items"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShoppingBag, ArrowRight, X } from "lucide-react"

export function CartSidebar({ children }: { children?: React.ReactNode }) {
  const { items } = useCartStore()
  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce(
    (sum, i) => sum + (i.product.discountedPrice ?? i.product.price) * i.quantity,
    0
  )

  const defaultTrigger = (
    <button className="relative group flex items-center justify-center w-9 h-9 hover:bg-transparent transition-colors">
      <ShoppingBag
        className="w-[18px] h-[18px] text-brand-cream/60 group-hover:text-brand-gold transition-colors"
        strokeWidth={1.5}
      />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-brand-gold text-brand-navy text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
          {count}
        </span>
      )}
    </button>
  )

  return (
    <Sheet>
      <SheetTrigger asChild>{children || defaultTrigger}</SheetTrigger>

      <SheetContent
        side="right"
        className="w-[100vw] sm:w-full sm:max-w-[420px] flex flex-col p-0 border-l border-brand-brass/20 [&>button]:hidden overflow-hidden"
      >
        {/* ── Header — dark navy ── */}
        <SheetHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4 border-b border-white/10 flex-row items-center justify-between space-y-0 shrink-0 bg-brand-navy">
          <SheetTitle className="font-serif text-lg sm:text-xl font-medium text-brand-cream flex items-center gap-2 sm:gap-2.5 tracking-wide">
            <ShoppingBag className="w-4 h-4 text-brand-gold" strokeWidth={1.5} />
            Your Gallery
          </SheetTitle>
          <div className="flex items-center gap-2 sm:gap-3">
            {count > 0 && (
              <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.16em] uppercase text-brand-gold border border-brand-gold/30 px-2 sm:px-3 py-1.5">
                {count} {count === 1 ? "piece" : "pieces"}
              </span>
            )}
            <SheetClose className="flex items-center justify-center w-8 h-8 text-brand-cream/40 hover:text-brand-cream transition-colors">
              <X className="w-5 h-5" strokeWidth={1.5} />
            </SheetClose>
          </div>
        </SheetHeader>

        {/* ── Item list — warm cream bg ── */}
        <div className="flex-1 overflow-y-auto bg-[#F7F3EC]">
          <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-3">
            <CartItems />
          </div>
        </div>

        {/* ── Footer — white bg ── */}
        {items.length > 0 && (
          <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-5 sm:pb-7 border-t border-brand-brass/15 shrink-0 bg-white">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[11px] sm:text-[13px] font-medium tracking-[0.14em] uppercase text-brand-navy/50">
                Subtotal
              </span>
              <span className="font-serif text-2xl sm:text-[32px] font-semibold text-brand-navy leading-none">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="font-serif italic text-[11px] sm:text-[12px] text-brand-navy/35 mb-4 sm:mb-6 text-right">
              Taxes &amp; shipping calculated at checkout
            </p>

            <SheetClose asChild>
              <Button
                asChild
                className="w-full h-12 sm:h-14 bg-brand-navy hover:bg-brand-navy/90 text-brand-cream font-semibold text-[11px] sm:text-[13px] tracking-[0.2em] uppercase rounded-none transition-all duration-200 group"
              >
                <Link href="/checkout" className="flex items-center justify-center gap-2 sm:gap-2.5">
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </SheetClose>

            <SheetClose asChild>
              <button className="w-full mt-3 sm:mt-4 text-[11px] sm:text-[12px] tracking-[0.14em] uppercase text-brand-navy/35 hover:text-brand-navy/60 transition-colors font-medium">
                Continue Shopping
              </button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}