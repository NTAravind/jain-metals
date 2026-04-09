"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

function PaginationContent({
  currentPage,
  totalPages,
}: {
  currentPage: number
  totalPages: number
}) {
  const searchParams = useSearchParams()

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    return `?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-16 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Button 
          variant="outline" 
          size="icon" 
          asChild
          className="w-11 h-11 flex-none flex items-center justify-center rounded-none border-brand-navy/15 text-brand-navy hover:bg-brand-navy/5 hover:border-brand-navy/30 transition-all"
        >
          <Link href={buildHref(currentPage - 1)}>
            <ChevronLeft className="w-5 h-5 shadow-none" />
          </Link>
        </Button>
      ) : (
        <Button 
          variant="outline" 
          size="icon" 
          disabled 
          className="w-11 h-11 flex-none flex items-center justify-center rounded-none border-brand-navy/10 text-brand-navy/30"
        >
          <ChevronLeft className="w-5 h-5 shadow-none" />
        </Button>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          const isSelected = p === currentPage;
          return (
            <Button
              key={p}
              variant="outline"
              size="icon"
              asChild={!isSelected}
              className={`
                w-11 h-11 flex-none flex items-center justify-center rounded-none border-brand-navy/15 text-[14px] font-bold transition-all
                ${isSelected 
                  ? "bg-brand-gold border-brand-gold text-brand-navy hover:bg-brand-gold shadow-sm" 
                  : "text-brand-navy hover:bg-brand-navy/5 hover:border-brand-navy/30"
                }
              `}
            >
              {!isSelected ? (
                <Link href={buildHref(p)}>
                  {p}
                </Link>
              ) : (
                <span className="select-none cursor-default">
                  {p}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Button 
          variant="outline" 
          size="icon" 
          asChild
          className="w-11 h-11 flex-none flex items-center justify-center rounded-none border-brand-navy/15 text-brand-navy hover:bg-brand-navy/5 hover:border-brand-navy/30 transition-all"
        >
          <Link href={buildHref(currentPage + 1)}>
            <ChevronRight className="w-5 h-5 shadow-none" />
          </Link>
        </Button>
      ) : (
        <Button 
          variant="outline" 
          size="icon" 
          disabled 
          className="w-11 h-11 flex-none flex items-center justify-center rounded-none border-brand-navy/10 text-brand-navy/30"
        >
          <ChevronRight className="w-5 h-5 shadow-none" />
        </Button>
      )}
    </div>
  )
}

export function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number
  totalPages: number
}) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center gap-2 mt-10" />}>
      <PaginationContent currentPage={currentPage} totalPages={totalPages} />
    </Suspense>
  )
}
