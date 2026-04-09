"use client"

import { DataTable, type Column } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

type Order = {
  id: string
  orderNumber: string
  user: { phone: string | null; name: string | null }
  status: string
  paymentStatus: string
  total: any
  createdAt: Date
}

const statusColorMap: Record<string, string> = {
  CONFIRMED: "bg-black dark:bg-white text-white dark:text-black hover:opacity-90",
  PROCESSING: "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700",
  SHIPPED: "bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700",
  DELIVERED: "bg-green-600 dark:bg-green-500 text-white hover:bg-green-700",
  CANCELLED: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  REFUNDED: "bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60 hover:bg-black/20",
  PENDING: "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 hover:bg-black/10",
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter()

  const columns: Column<Order>[] = [
    {
      key: "orderNumber",
      header: "Order #",
      cell: (row) => (
        <span className="font-mono text-xs">#{row.orderNumber.slice(-8)}</span>
      ),
    },
    {
      key: "phone",
      header: "Customer",
      cell: (row) => (
        <span className="text-sm">{row.user.phone ?? row.user.name ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge className={`rounded-full px-3 py-0.5 border-none font-bold text-[10px] uppercase tracking-wider ${statusColorMap[row.status] ?? "bg-black/5 dark:bg-white/5 text-black/40"}`}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "paymentStatus",
      header: "Payment",
      cell: (row) => (
        <Badge className={`rounded-full px-3 py-0.5 border-none font-bold text-[10px] uppercase tracking-wider ${row.paymentStatus === "PAID" ? "bg-green-600/10 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-600/10 dark:bg-red-500/10 text-red-700 dark:text-red-400"}`}>
          {row.paymentStatus}
        </Badge>
      ),
    },
    {
      key: "total",
      header: "Total",
      cell: (row) => `₹${Number(row.total).toLocaleString("en-IN")}`,
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (row) =>
        new Date(row.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={orders}
      onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
      searchPlaceholder="Search by order #..."
      emptyMessage="No orders yet."
    />
  )
}
