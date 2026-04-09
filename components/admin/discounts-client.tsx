"use client"

import { useState } from "react"
import {
  createDiscountAction,
  updateDiscountAction,
  deleteDiscountAction,
} from "@/actions/discounts"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"

type Discount = {
  id: string
  code: string | null
  type: string
  value: any
  minOrderValue: any
  usedCount: number
  maxUses: number | null
  isActive: boolean
  expiresAt: Date | null
}

function DiscountForm({
  discount,
  onSubmit,
}: {
  discount?: Discount | null
  onSubmit: (fd: FormData) => Promise<void>
}) {
  const [type, setType] = useState(discount?.type ?? "PERCENTAGE")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("type", type)
    await onSubmit(fd)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Key Designation (Code)</Label>
          <Input
            name="code"
            defaultValue={discount?.code ?? ""}
            placeholder="e.g. WELCOME20"
            className="h-12 rounded-xl border-black/10 bg-black/[0.02] uppercase font-mono text-base focus:ring-black transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Adjustment Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-12 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-black/10">
              <SelectItem value="PERCENTAGE">Value Percentage</SelectItem>
              <SelectItem value="FIXED">Flat Deduction</SelectItem>
              <SelectItem value="FREE_DELIVERY">Logistics Waiver</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Reduction Magnitude</Label>
          <div className="relative">
            <Input
              name="value"
              type="number"
              step="0.01"
              defaultValue={discount ? Number(discount.value) : ""}
              required
              placeholder="0.00"
              className="h-12 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-black/30">
              {type === "PERCENTAGE" ? "%" : "₹"}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Minimum Acquisition (₹)</Label>
          <Input
            name="minOrderValue"
            type="number"
            placeholder="0"
            className="h-12 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
            defaultValue={
              discount?.minOrderValue ? Number(discount.minOrderValue) : ""
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Usage Limit</Label>
          <Input
            name="maxUses"
            type="number"
            placeholder="No limit"
            className="h-12 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
            defaultValue={discount?.maxUses ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">Expiration Temporal Point</Label>
          <Input
            name="expiresAt"
            type="date"
            className="h-12 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
            defaultValue={
              discount?.expiresAt
                ? new Date(discount.expiresAt).toISOString().split("T")[0]
                : ""
            }
          />
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full h-14 rounded-2xl bg-black text-white font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-xl shadow-black/10 mt-4"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : discount ? (
          "Update Key Protocol"
        ) : (
          "Finalize Privilege Key"
        )}
      </Button>
    </form>
  )
}

export function DiscountsClient({ discounts }: { discounts: Discount[] }) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Discount | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Discount>[] = [
    { key: "code", header: "Code", cell: (r) => r.code ?? "—" },
    {
      key: "type",
      header: "Type",
      cell: (r) => <Badge variant="outline">{r.type}</Badge>,
    },
    {
      key: "value",
      header: "Value",
      cell: (r) =>
        r.type === "PERCENTAGE"
          ? `${Number(r.value)}%`
          : `₹${Number(r.value)}`,
    },
    {
      key: "minOrderValue",
      header: "Min Order",
      cell: (r) =>
        r.minOrderValue ? `₹${Number(r.minOrderValue)}` : "—",
    },
    {
      key: "usedCount",
      header: "Used",
      cell: (r) => `${r.usedCount}${r.maxUses ? ` / ${r.maxUses}` : ""}`,
    },
    {
      key: "expiresAt",
      header: "Expires",
      cell: (r) =>
        r.expiresAt
          ? new Date(r.expiresAt).toLocaleDateString("en-IN")
          : "—",
    },
    {
      key: "isActive",
      header: "Status",
      cell: (r) => (
        <Badge variant={r.isActive ? "default" : "outline"}>
          {r.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setEditing(r)
              setDialogOpen(true)
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDeleteId(r.id)}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-black">Active Privilege Keys</h2>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">Archive of all promotional value overrides</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
          className="h-12 px-6 rounded-xl bg-black text-white font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl shadow-black/10"
        >
          <Plus className="w-4 h-4 mr-2" /> Forge New Key
        </Button>
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
          data={discounts}
          emptyMessage="No privilege keys found in the registry."
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-black/10 bg-white p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-black tracking-tight">
              {editing ? "Override Protocol" : "Initialize New Key"}
            </DialogTitle>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mt-1">Configure the parameters for value adjustment</p>
          </DialogHeader>
          <DiscountForm
            discount={editing}
            onSubmit={async (fd) => {
              editing
                ? await updateDiscountAction(editing.id, fd)
                : await createDiscountAction(fd)
              toast.success(editing ? "Key updated" : "Key forged")
              setDialogOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-black/10 bg-white p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-black">Decommission Key?</AlertDialogTitle>
            <AlertDialogDescription className="text-black/60">
              This will permanently revoke the privilege key from the archive. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-xl border-black/10 hover:bg-black/5">Abort</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteId) return
                await deleteDiscountAction(deleteId)
                toast.success("Key decommissioned")
                setDeleteId(null)
                router.refresh()
              }}
            >
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
