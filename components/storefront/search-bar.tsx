"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

function SearchBarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(searchParams.get("q") ?? "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const q = searchParams.get("q") ?? ""
    setValue(q)
    if (q) setIsOpen(true)
  }, [searchParams])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    const trimmed = value.trim().toLowerCase()
    if (trimmed) params.set("q", trimmed)
    else params.delete("q")
    params.delete("page")
    router.push(`/products?${params.toString()}`)
  }

  const handleClear = () => {
    setValue("")
    if (!searchParams.get("q")) {
      setIsOpen(false)
    } else {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("q")
      params.delete("page")
      router.push(`/products?${params.toString()}`)
    }
  }

  return (
    <div className={cn("flex min-w-0 items-center justify-end transition-all duration-300", isOpen ? "w-[min(72vw,280px)] sm:w-full" : "w-10")}>
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="search-icon"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsOpen(true)}
            className="p-2 text-brand-navy/60 hover:text-brand-gold transition-colors"
            aria-label="Open search"
          >
            <Search className="w-5 h-5" />
          </motion.button>
        ) : (
          <motion.form
            key="search-form"
            initial={{ opacity: 0, scaleX: 0.92 }}
            animate={{ width: "100%", opacity: 1 }}
            exit={{ opacity: 0, scaleX: 0.92 }}
            onSubmit={handleSubmit}
            className="relative flex min-w-0 origin-right items-center w-full max-w-[280px]"
          >
            <Search className="absolute left-3 w-4 h-4 text-brand-navy/30 pointer-events-none" />
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search Archive..."
              className="pl-9 pr-8 h-10 bg-brand-cream/[0.05] border-brand-brass/20 rounded-sm focus-visible:ring-1 focus-visible:ring-brand-gold/50 text-xs uppercase tracking-[0.14em] sm:tracking-[0.2em] font-bold text-brand-navy shadow-sm"
              onBlur={() => {
                if (!value && !searchParams.get("q")) setIsOpen(false)
              }}
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 text-brand-navy/30 hover:text-brand-navy"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

export function SearchBar() {
  return (
    <Suspense fallback={<button className="p-2"><span className="sr-only">Search</span></button>}>
      <SearchBarContent />
    </Suspense>
  )
}
