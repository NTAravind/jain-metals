"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"

export interface Column<T> {
  key: string
  header: React.ReactNode
  cell?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  searchKey?: keyof T
  searchKeys?: (keyof T)[]
  searchPlaceholder?: string
  emptyMessage?: string
  searchable?: boolean
  serverSide?: boolean
  currentPage?: number
  pageCount?: number
  totalCount?: number
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  searchKey,
  searchKeys,
  searchPlaceholder = "Find matching records...",
  emptyMessage = "No results archived.",
  searchable,
  serverSide,
  currentPage = 1,
  pageCount = 1,
  totalCount = 0,
}: DataTableProps<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(serverSide ? searchParams.get("search") || "" : "")

  const shouldSearch = searchable || searchKey || searchKeys

  useEffect(() => {
    if (!serverSide) return
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (search) {
        params.set("search", search)
      } else {
        params.delete("search")
      }
      params.set("page", "1") // reset to page 1 on new search
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }, 400)
    return () => clearTimeout(timeout)
  }, [search, serverSide, pathname, router, searchParams])

  const handlePageChange = (newPage: number) => {
    if (!serverSide) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const filtered = (shouldSearch && !serverSide)
    ? data.filter((row) => {
        const term = search.toLowerCase()
        if (searchKeys) {
          return searchKeys.some((key) =>
            String(row[key]).toLowerCase().includes(term)
          )
        }
        if (searchKey) {
          return String(row[searchKey]).toLowerCase().includes(term)
        }
        return true
      })
    : data

  return (
    <div className="space-y-6">
      {shouldSearch && (
        <div className="relative group">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md h-12 pl-4 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-sm font-medium"
          />
        </div>
      )}
      <div className="rounded-2xl border border-black/5 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-black/5 bg-black/[0.01] hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.key} className={`h-14 px-8 font-bold uppercase tracking-widest text-[10px] text-black/40 ${col.className}`}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-24 text-black/30 font-medium italic"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-black/5 transition-all duration-200 ${
                    onRowClick
                      ? "cursor-pointer hover:bg-black/[0.02]"
                      : "hover:bg-transparent"
                  }`}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={`px-8 py-5 text-sm font-medium text-black/80 ${col.className}`}>
                      {col.cell
                        ? col.cell(row)
                        : String((row as any)[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2 pt-4">
        {serverSide ? (
           <>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
                Showing {data.length} records {totalCount > 0 && `of ${totalCount} total`}
              </p>
              <div className="flex items-center gap-4">
                 <button
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="text-xs font-bold uppercase tracking-widest text-black/60 hover:text-black disabled:opacity-30 transition-all"
                 >
                    Previous
                 </button>
                 <span className="text-xs font-bold text-black/30">
                    Page {currentPage} of {Math.max(1, pageCount)}
                 </span>
                 <button
                    disabled={currentPage >= pageCount}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="text-xs font-bold uppercase tracking-widest text-black/60 hover:text-black disabled:opacity-30 transition-all"
                 >
                    Next
                 </button>
              </div>
           </>
        ) : (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">
            Showing {filtered.length} of {data.length} registered entries
          </p>
        )}
      </div>
    </div>
  )
}
