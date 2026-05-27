"use client"

import Link from "next/link"
import { ShoppingCart, Menu, X, User, ChevronDown, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"
import { useCartStore } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { CartSidebar } from "@/components/cart-sidebar"
import { SearchBar } from "./search-bar"
import { motion, AnimatePresence, useScroll } from "framer-motion"

export function Navbar({ categories = [], collections = [] }: { categories: any[]; collections: any[] }) {
  const [open, setOpen] = useState(false)
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [otherOpen, setOtherOpen] = useState(false)
  const [mobileShopOpen, setMobileShopOpen] = useState(false)
  const { data: session } = useSession()
  const count = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0))

  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)

  // FIX 1: use scrollY.on() not scrollY.onChange() (deprecated in Framer Motion v10+)
  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsScrolled(latest > 20)
    })
    return unsubscribe
  }, [scrollY])

  // FIX 2: lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const closeAll = () => {
    setOpen(false)
    setMobileShopOpen(false)
  }

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 
          transition-all duration-500 ease-in-out
          ${isScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-black/10 h-20"
            : "bg-white h-24 border-b border-black/5"}
        `}
      >
        <div className="max-w-[1440px] mx-auto h-full px-8 md:px-12 flex items-center justify-between">

          {/* Brand Identity - Left */}
          <div className="flex-1 flex justify-start items-center gap-12">
            <Link href="/" className="shrink-0 group">
              <img
                src="/images/brand/logo_gold_clean.png"
                alt="Jain Metals"
                className={`
                  transition-all duration-700 object-contain  
                  ${isScrolled ? "h-14" : "h-16"}
                `}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-10">
              <div
                className="relative h-20 flex items-center group cursor-pointer"
                onMouseEnter={() => setCollectionsOpen(true)}
                onMouseLeave={() => setCollectionsOpen(false)}
              >
                <Link
                  href="/products"
                  className="text-[10px] font-bold tracking-[0.25em] uppercase text-black/60 hover:text-black transition-all flex items-center gap-2"
                >
                  Shop <ChevronDown className={`w-3 h-3 transition-transform duration-500 ${collectionsOpen ? "rotate-180" : ""}`} />
                </Link>

                {/* FIX 4: dropdown — use mt-px to bridge the gap so hover doesn't flicker */}
                <AnimatePresence>
                  {collectionsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[calc(100%-1px)] left-0 w-[480px] bg-white border border-black/10 shadow-2xl grid grid-cols-2 p-8 z-[60] "
                    >
                      <div className="space-y-4 pr-8 border-r border-black/5">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/30">Collections</p>
                        <div className="space-y-1">
                          {categories.slice(0, 5).map((cat) => (
                            <Link
                              key={cat.id}
                              href={`/products?category=${cat.slug}`}
                              className="block py-2 text-[11px] font-bold tracking-widest uppercase text-black/60 hover:text-black hover:translate-x-1 transition-all"
                              onClick={() => setCollectionsOpen(false)}
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-6 pl-8">
                        <div className="aspect-[4/3] bg-brand-navy relative overflow-hidden group/img">
                          <img
                            src="/images/brand/promo_statue.jpg"
                            className="w-full h-full object-cover opacity-60 group-hover/img:scale-110 transition-transform duration-1000"
                            alt="Promotional"
                            onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1621244299838-2d71d023c65d?q=80&w=2670&auto=format&fit=crop")}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/50 mb-1">New Arrival</p>
                            <p className="text-sm font-serif text-white italic">Our Latest Products</p>
                          </div>
                        </div>
                        <Link href="/products" className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/40 hover:text-black flex items-center gap-2" onClick={() => setCollectionsOpen(false)}>
                          View All Products <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="/products"
                className="text-[10px] font-bold tracking-[0.25em] uppercase text-black/60 hover:text-black transition-all"
              >
                Our Products
              </Link>

              {/* Other collections dropdown */}
              {collections.length > 0 && (
                <div
                  className="relative h-20 flex items-center group cursor-pointer"
                  onMouseEnter={() => setOtherOpen(true)}
                  onMouseLeave={() => setOtherOpen(false)}
                >
                  <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-black/60 hover:text-black transition-all flex items-center gap-2">
                    Other <ChevronDown className={`w-3 h-3 transition-transform duration-500 ${otherOpen ? "rotate-180" : ""}`} />
                  </span>

                  <AnimatePresence>
                    {otherOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-[calc(100%-1px)] left-0 min-w-[200px] bg-white border border-black/10 shadow-2xl py-4 z-[60]"
                      >
                        <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-black/30 px-6 pb-3">Collections</p>
                        {collections.map((col: any) => (
                          <Link
                            key={col.id}
                            href={`/collections/${col.slug}`}
                            className="block px-6 py-2.5 text-[11px] font-bold tracking-widest uppercase text-black/60 hover:text-black hover:translate-x-1 transition-all"
                            onClick={() => setOtherOpen(false)}
                          >
                            {col.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {session && (
                <Link
                  href="/orders"
                  className="text-[10px] font-bold tracking-[0.25em] uppercase text-black/60 hover:text-black transition-all"
                >
                  My Orders
                </Link>
              )}
            </nav>
          </div>

          <div className="flex-1 min-w-0 flex justify-end items-center gap-2 md:gap-8">
            <SearchBar />
            <CartSidebar>
              <Button variant="ghost" className="relative h-12 w-12 p-0 hover:bg-black/5 rounded-xl group border border-black/10 transition-all">
                <ShoppingCart className="w-5 h-5 text-black/60 group-hover:text-black transition-colors" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-white">
                    {count}
                  </span>
                )}
              </Button>
            </CartSidebar>

            <div className="hidden md:flex items-center gap-2">
              {session ? (
                <Button
                  variant="ghost"
                  className="h-12 px-5 hover:bg-black/5 rounded-xl group transition-all"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <User className="w-4 h-4 text-black/60 group-hover:text-black transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] ml-2 text-black/60 group-hover:text-black">Admin Exit</span>
                </Button>
              ) : (
                <Button variant="ghost" asChild className="h-12 px-5 hover:bg-black/5 rounded-xl group border border-black/10 transition-all">
                  <Link href="/login" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-black/60 group-hover:text-black transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 group-hover:text-black">Patron Entry</span>
                  </Link>
                </Button>
              )}
            </div>

            <button
              className="lg:hidden p-3 rounded-xl border border-black/5 hover:bg-black/5 transition-all"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X className="w-6 h-6 text-black" /> : <Menu className="w-6 h-6 text-black" />}
            </button>
          </div>
        </div>
      </header>

      {/* FIX 5: mobile menu is now a sibling of header, not inside it.
          This fixes z-index stacking and overflow clipping issues. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            // FIX 6: z-[200] so it's above header's z-50, removed pointer-events-auto (default)
            className="fixed inset-0 bg-brand-navy z-[200] p-8 md:p-12 flex flex-col overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-16 md:mb-20">
              <img src="/images/brand/logo_gold_clean.png" className="h-12 brightness-200" alt="Logo" />
              <button
                onClick={closeAll}
                className="text-white hover:text-brand-gold transition-colors"
                aria-label="Close menu"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-1 space-y-12">
              <AnimatePresence mode="wait">
                {!mobileShopOpen ? (
                  <motion.div
                    key="main-menu"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-10"
                  >
                    <div className="space-y-4">
                      <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold">Menu</p>
                      <nav className="space-y-8">
                        <button
                          onClick={() => setMobileShopOpen(true)}
                          className="w-full text-left flex items-center justify-between group"
                        >
                          <span className="text-4xl font-serif text-brand-cream group-hover:italic group-hover:text-brand-gold transition-all">
                            Shop
                          </span>
                          <ChevronDown className="-rotate-90 w-6 h-6 text-brand-gold/50" />
                        </button>

                        {session && (
                          <Link href="/orders" className="block text-4xl font-serif text-brand-cream hover:italic hover:text-brand-gold transition-all" onClick={closeAll}>
                            My Orders
                          </Link>
                        )}
                      </nav>
                    </div>

                    <div className="pt-10 border-t border-brand-brass/20">
                      {session ? (
                        <div className="space-y-6">
                          <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold">Account</p>
                          <Button
                            className="w-full bg-brand-gold text-brand-navy rounded-none h-16 uppercase tracking-[0.3em] text-[11px] font-bold"
                            onClick={() => {
                              signOut({ callbackUrl: "/" })
                              closeAll()
                            }}
                          >
                            Logout
                          </Button>
                        </div>
                      ) : (
                        <Button asChild className="w-full bg-white/10 hover:bg-white/20 text-brand-cream rounded-none h-16 uppercase tracking-[0.3em] text-[11px] font-bold border border-brand-brass/20">
                          <Link href="/login" onClick={closeAll}>Login / Register</Link>
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="shop-menu"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-10"
                  >
                    <button
                      onClick={() => setMobileShopOpen(false)}
                      className="flex items-center gap-3 text-brand-gold font-bold uppercase tracking-[0.3em] text-[10px] mb-8 hover:translate-x-[-4px] transition-transform"
                    >
                      <ChevronDown className="rotate-90 w-4 h-4" /> Back to Menu
                    </button>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold">Explore</p>
                        <Link
                          href="/products"
                          className="block text-3xl font-serif text-brand-cream border-b border-brand-brass/10 pb-4"
                          onClick={closeAll}
                        >
                          View All Products
                        </Link>
                      </div>

                      <div className="space-y-6">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold opacity-60">By Category</p>
                        <div className="grid grid-cols-1 gap-6">
                          {categories.map((cat: any) => (
                            <Link
                              key={cat.id}
                              href={`/products?category=${cat.slug}`}
                              className="text-xl font-serif text-brand-cream/80 hover:text-brand-gold transition-colors flex items-center justify-between"
                              onClick={closeAll}
                            >
                              {cat.name}
                              <ChevronDown className="-rotate-90 w-4 h-4 opacity-30" />
                            </Link>
                          ))}
                        </div>
                      </div>

                      {collections.length > 0 && (
                        <div className="space-y-6 pt-6 border-t border-brand-brass/10">
                          <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold opacity-60">Other Collections</p>
                          <div className="grid grid-cols-1 gap-6">
                            {collections.map((col: any) => (
                              <Link
                                key={col.id}
                                href={`/collections/${col.slug}`}
                                className="text-xl font-serif text-brand-cream/80 hover:text-brand-gold transition-colors flex items-center justify-between"
                                onClick={closeAll}
                              >
                                {col.name}
                                <ChevronDown className="-rotate-90 w-4 h-4 opacity-30" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-auto py-8">
              <p className="text-center text-[9px] uppercase tracking-[0.5em] text-brand-cream/20">Jain Metals Since 1964</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
