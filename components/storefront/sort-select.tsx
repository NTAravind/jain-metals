"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"

const SORT_OPTIONS = [
  { value: "", label: "Default", icon: "✦" },
  { value: "bestseller", label: "Bestseller", icon: "🏆" },
  { value: "price_asc", label: "Price: Low → High", icon: "↑" },
  { value: "price_desc", label: "Price: High → Low", icon: "↓" },
  { value: "date_desc", label: "Newest First", icon: "★" },
  { value: "date_asc", label: "Oldest First", icon: "◇" },
]

function SortSelectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get("sort") ?? ""
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const active = SORT_OPTIONS.find((o) => o.value === currentSort) ?? SORT_OPTIONS[0]

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const select = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("sort", value)
    else params.delete("sort")
    params.delete("page")
    router.push(`/products?${params.toString()}`)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="group flex items-center gap-2.5 px-4 py-2.5 bg-brand-navy border border-brand-gold/30 hover:border-brand-gold/70 transition-all duration-200 cursor-pointer"
      >
        <span className="text-brand-gold text-[10px]">{active.icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-cream whitespace-nowrap">
          {currentSort ? active.label : "Sort By"}
        </span>
        {/* Chevron */}
        <svg
          className={`w-3 h-3 text-brand-gold/70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ─── Desktop dropdown ─────────────────────────── */}
      {open && (
        <div
          role="listbox"
          className="hidden md:block absolute right-0 top-full mt-2 w-52 bg-brand-navy border border-brand-gold/25 shadow-[0_8px_32px_rgba(13,18,53,0.4)] z-50 overflow-hidden"
        >
          {/* Gold top accent */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-brand-gold to-transparent" />

          <div className="py-2">
            {SORT_OPTIONS.map((opt) => {
              const isActive = opt.value === currentSort
              return (
                <button
                  key={opt.value}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => select(opt.value)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all duration-150 group
                    ${isActive
                      ? "bg-brand-gold/10 text-brand-gold"
                      : "text-brand-cream/70 hover:bg-brand-gold/5 hover:text-brand-cream"
                    }`}
                >
                  <span className={`text-xs w-4 text-center shrink-0 ${isActive ? "text-brand-gold" : "text-brand-gold/40 group-hover:text-brand-gold/60"}`}>
                    {opt.icon}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">{opt.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-gold shadow-[0_0_6px_rgba(201,168,76,0.8)]" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Gold bottom accent */}
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />
        </div>
      )}

      {/* ─── Mobile bottom sheet ──────────────────────── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-brand-navy/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="relative bg-brand-navy border-t border-brand-gold/30 shadow-[0_-8px_40px_rgba(13,18,53,0.6)] animate-in slide-in-from-bottom duration-300">
            {/* Pull handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-brand-gold/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-gold/15">
              <div className="flex items-center gap-3">
                <div className="w-4 h-[1.5px] bg-brand-gold/40" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Sort By</p>
                <div className="w-4 h-[1.5px] bg-brand-gold/40" />
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-brand-cream/50 hover:text-brand-cream transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Options */}
            <div className="px-4 py-4 space-y-1.5 pb-8">
              {SORT_OPTIONS.map((opt) => {
                const isActive = opt.value === currentSort
                return (
                  <button
                    key={opt.value}
                    onClick={() => select(opt.value)}
                    className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-150 border
                      ${isActive
                        ? "bg-brand-gold/10 border-brand-gold/30 text-brand-gold"
                        : "border-transparent text-brand-cream/70 hover:bg-brand-gold/5 hover:text-brand-cream active:bg-brand-gold/10"
                      }`}
                  >
                    <span className={`text-base w-6 text-center shrink-0 ${isActive ? "text-brand-gold" : "text-brand-gold/40"}`}>
                      {opt.icon}
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-[0.12em] text-left">{opt.label}</span>
                    {isActive && (
                      <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-brand-gold/20 border border-brand-gold/40">
                        <svg className="w-2.5 h-2.5 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ssr: false prevents the hydration mismatch — this component is
// purely interactive and has no meaningful server-rendered output.
export const SortSelect = dynamic(() => Promise.resolve(SortSelectContent), {
  ssr: false,
  loading: () => (
    <button className="flex items-center gap-2.5 px-4 py-2.5 bg-brand-navy border border-brand-gold/30 opacity-50 cursor-wait">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-cream">Sort By</span>
      <svg className="w-3 h-3 text-brand-gold/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  ),
})
