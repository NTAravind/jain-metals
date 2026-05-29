"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, X, ArrowRight, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

function SearchBarContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isOpen, setIsOpen] = useState(false)
  // Local input value — separate from URL query so we can type without navigating
  const [value, setValue] = useState("")
  const [isNavigating, setIsNavigating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevPathname = useRef(pathname)

  // Sync input value from URL only when on /products page
  useEffect(() => {
    if (pathname === "/products" || pathname.startsWith("/products?")) {
      const q = searchParams.get("q") ?? ""
      setValue(q)
    }
  }, [searchParams, pathname])

  // Auto-close search overlay after navigation completes (pathname changed)
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      setIsNavigating(false)
      // Close after a short delay so the user sees the page start to load
      const timer = setTimeout(() => setIsOpen(false), 200)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen])

  const close = useCallback(() => {
    setIsOpen(false)
    setIsNavigating(false)
  }, [])

  const open = useCallback(() => {
    // Pre-fill with current search query if on products page
    if (pathname === "/products" || pathname.startsWith("/products?")) {
      setValue(searchParams.get("q") ?? "")
    }
    setIsOpen(true)
  }, [pathname, searchParams])

  const submit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return

    setIsNavigating(true)

    // Build clean params — preserve category if on products page
    const params = new URLSearchParams()
    const category = searchParams.get("category")
    if (category) params.set("category", category)
    params.set("q", trimmed)

    router.push(`/products?${params.toString()}`)
  }, [value, searchParams, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit()
  }

  const handleClear = () => {
    setValue("")
    inputRef.current?.focus()
  }

  const handleClearAndSearch = () => {
    setValue("")
    // Navigate to products without query
    const params = new URLSearchParams()
    const category = searchParams.get("category")
    if (category) params.set("category", category)
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`)
    inputRef.current?.focus()
  }

  return (
    <>
      {/* ── Trigger button (always visible) ─────────────────────────────── */}
      <button
        onClick={open}
        className="p-2 text-black/60 hover:text-black transition-colors flex items-center justify-center"
        aria-label="Open search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* ── Search overlay ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="search-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm"
              onClick={close}
            />

            {/* Search panel */}
            <motion.div
              key="search-panel"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed top-0 inset-x-0 z-[201] bg-white border-b border-black/10 shadow-2xl shadow-black/10"
            >
              <form
                onSubmit={handleSubmit}
                className="max-w-[1440px] mx-auto flex items-center gap-4 px-5 md:px-12 h-20"
              >
                {/* Icon / Loading state */}
                {isNavigating ? (
                  <Loader2 className="w-5 h-5 text-black/40 shrink-0 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 text-black/30 shrink-0" />
                )}

                {/* Input */}
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Search products…"
                  className="flex-1 min-w-0 bg-transparent text-black text-base md:text-lg font-medium placeholder:text-black/25 outline-none border-none ring-0 caret-black"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  disabled={isNavigating}
                />

                {/* Clear button */}
                {value && !isNavigating && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="shrink-0 p-2 text-black/30 hover:text-black transition-colors"
                    aria-label="Clear"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                {/* Search submit */}
                <button
                  type="submit"
                  disabled={isNavigating || !value.trim()}
                  className="shrink-0 flex items-center gap-2 h-11 px-5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Search"
                >
                  <span className="hidden sm:inline">Search</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={close}
                  className="shrink-0 p-2 text-black/40 hover:text-black transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>

              {/* Status line */}
              <div className="max-w-[1440px] mx-auto px-5 md:px-12 pb-3 flex items-center gap-3">
                {isNavigating ? (
                  <p className="text-xs text-black/40 font-medium animate-pulse">
                    Searching for &quot;<span className="text-black/60">{value.trim()}</span>&quot;…
                  </p>
                ) : searchParams.get("q") && (pathname === "/products" || pathname.startsWith("/products?")) ? (
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-black/30 font-medium">
                      Results for &quot;<span className="text-black/60">{searchParams.get("q")}</span>&quot;
                    </p>
                    <button
                      type="button"
                      onClick={handleClearAndSearch}
                      className="text-xs text-black/40 hover:text-black underline underline-offset-2 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-black/20 font-medium">
                    Press Enter or click Search — you can search from any page
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export function SearchBar() {
  return (
    <Suspense fallback={
      <button className="p-2 text-black/60" aria-label="Search">
        <Search className="w-5 h-5" />
      </button>
    }>
      <SearchBarContent />
    </Suspense>
  )
}
