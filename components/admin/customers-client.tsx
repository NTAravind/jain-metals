"use client"

import { DataTable, type Column } from "@/components/admin/data-table"
import { useRouter } from "next/navigation"

type Customer = {
  id: string
  name: string | null
  phone: string | null
  createdAt: Date
  _count: { orders: number }
}

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const router = useRouter()

  const columns: Column<Customer>[] = [
    {
      key: "phone",
      header: "Phone",
      cell: (r) => r.phone ?? "—",
    },
    {
      key: "name",
      header: "Name",
      cell: (r) => r.name ?? "—",
    },
    {
      key: "orders",
      header: "Orders",
      cell: (r) => r._count.orders,
    },
    {
      key: "createdAt",
      header: "Joined",
      cell: (r) =>
        new Date(r.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-black">Active Patrons</h2>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">Verified directory of store interactions</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        <DataTable
          columns={columns.map(col => ({
            ...col,
            header: (
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                {col.header as string}
              </span>
            )
          }))}
          data={customers}
          onRowClick={(r) => router.push(`/admin/customers/${r.id}`)}
          searchPlaceholder="Identify patron by phone..."
          emptyMessage="No patron records archived yet."
        />
      </div>
    </div>
  )
}
