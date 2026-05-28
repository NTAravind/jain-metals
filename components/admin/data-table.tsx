"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
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
  filterSlot?: React.ReactNode
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
  filterSlot,
}: DataTableProps<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(
    serverSide ? (searchParams.get("search") ?? "") : ""
  )

  // Only true after the user has actually typed — never fires on navigation
  const userChangedSearch = useRef(false)

  const shouldSearch = searchable || searchKey || searchKeys

  // Sync search state when URL changes externally (pagination, back/forward).
  // Resets userChangedSearch so the debounce effect doesn't fire and
  // overwrite the page param the pagination link just set.
  useEffect(() => {
    if (!serverSide) return
    const urlSearch = searchParams.get("search") ?? ""
    if (urlSearch !== search) {
      userChangedSearch.current = false
      setSearch(urlSearch)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Debounced search: only fires when the user types
  useEffect(() => {
    if (!serverSide || !userChangedSearch.current) return
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      if (search) {
        params.set("search", search)
      } else {
        params.delete("search")
      }
      params.set("page", "1")
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }, 400)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Build a page URL by copying current search params and overriding `page`
  const pageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    return `${pathname}?${params.toString()}`
  }

  const filtered =
    shouldSearch && !serverSide
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
      <div className="flex items-center justify-between gap-4">
        <div className="relative group flex-1 max-w-md">
          {shouldSearch && (
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                userChangedSearch.current = true
                setSearch(e.target.value)
              }}
              className="max-w-md h-12 pl-4 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-sm font-medium"
            />
          )}
        </div>
        {filterSlot}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-black/5 bg-black/[0.01] hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`h-14 px-8 font-bold uppercase tracking-widest text-[10px] text-black/40 ${col.className}`}
                >
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
                    <TableCell
                      key={col.key}
                      className={`px-8 py-5 text-sm font-medium text-black/80 ${col.className}`}
                    >
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
              Showing {data.length} records{" "}
              {totalCount > 0 && `of ${totalCount} total`}
            </p>
            <div className="flex items-center gap-4">
              {currentPage <= 1 ? (
                <span className="text-xs font-bold uppercase tracking-widest text-black/20 cursor-not-allowed">
                  Previous
                </span>
              ) : (
                <Link
                  href={pageUrl(currentPage - 1)}
                  scroll={false}
                  className="text-xs font-bold uppercase tracking-widest text-black/60 hover:text-black transition-all"
                >
                  Previous
                </Link>
              )}
              <span className="text-xs font-bold text-black/30">
                Page {currentPage} of {Math.max(1, pageCount)}
              </span>
              {currentPage >= pageCount ? (
                <span className="text-xs font-bold uppercase tracking-widest text-black/20 cursor-not-allowed">
                  Next
                </span>
              ) : (
                <Link
                  href={pageUrl(currentPage + 1)}
                  scroll={false}
                  className="text-xs font-bold uppercase tracking-widest text-black/60 hover:text-black transition-all"
                >
                  Next
                </Link>
              )}
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