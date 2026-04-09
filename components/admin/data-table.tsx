"use client"

import { useState } from "react"
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
  searchPlaceholder?: string
  emptyMessage?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  searchKey,
  searchPlaceholder = "Find matching records...",
  emptyMessage = "No results archived.",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")

  const filtered = searchKey
    ? data.filter((row) =>
        String(row[searchKey]).toLowerCase().includes(search.toLowerCase()),
      )
    : data

  return (
    <div className="space-y-6">
      {searchKey && (
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
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">
          Showing {filtered.length} of {data.length} registered entries
        </p>
      </div>
    </div>
  )
}
