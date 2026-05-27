"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

function SearchBarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(searchParams.get("q") ?? "")
  const inputRef = useRef<HTMLInputElement>(null)
  // Track pointer-down on submit to prevent onBlur closing before submit
  const submitPending = useRef(false)

  useEffect(() => {
    const q = searchParams.get("q") ?? ""
    setValue(q)
    if (q) setIsOpen(true)
  }, [searchParams])

  useEffect(() => {
    if (isOpen) {
      // Small timeout so mobile keyboard doesn't fight with animation
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen])

  const close = () => {
    setIsOpen(false)
    submitPending.current = false
  }

  const submit = () => {
    const params = new URLSearchParams(searchParams.toString())
    const trimmed = value.trim()
    if (trimmed) params.set("q", trimmed)
    else params.delete("q")
    params.delete("page")
    router.push(`/products?${params.toString()}`)
    // Don't close — keep search open so user sees they landed on results
    submitPending.current = false
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit()
  }

  const handleClear = () => {
    setValue("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("q")
    params.delete("page")
    router.push(`/products?${params.toString()}`)
    inputRef.current?.focus()
  }

  return (
    <>
      {/* ── Trigger button (always visible) ────────────────────────────── */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-black/60 hover:text-black transition-colors flex items-center justify-center"
        aria-label="Open search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* ── Search overlay (portal-style, covers full viewport) ─────────── */}
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

            {/* Search panel — slides down from top */}
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
                {/* Icon */}
                <Search className="w-5 h-5 text-black/30 shrink-0" />

                {/* Input — takes all available space */}
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
                />

                {/* Clear button — only when there's text */}
                {value && (
                  <button
                    type="button"
                    onPointerDown={() => { submitPending.current = true }}
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
                  onPointerDown={() => { submitPending.current = true }}
                  className="shrink-0 flex items-center gap-2 h-11 px-5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-80 transition-opacity"
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

              {/* Optional: show current query as a hint */}
              {searchParams.get("q") && (
                <div className="max-w-[1440px] mx-auto px-5 md:px-12 pb-3">
                  <p className="text-xs text-black/30 font-medium">
                    Showing results for &quot;<span className="text-black/60">{searchParams.get("q")}</span>&quot;
                  </p>
                </div>
              )}
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
