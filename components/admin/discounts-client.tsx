"use client"

import { useState, useCallback } from "react"
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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react"

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

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed Amount" },
  { value: "free_delivery", label: "Free Delivery" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

function DiscountForm({
  discount,
  onSubmit,
}: {
  discount?: Discount | null
  onSubmit: (fd: FormData) => Promise<void>
}) {
  const [type, setType] = useState(discount?.type ?? "PERCENTAGE")
  const [isActive, setIsActive] = useState(discount?.isActive ?? true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("type", type)
    fd.set("isActive", isActive ? "true" : "false")
    await onSubmit(fd)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Coupon Code */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">
            Coupon Code
          </Label>
          <Input
            name="code"
            defaultValue={discount?.code ?? ""}
            placeholder="e.g. SAVE20"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] uppercase font-mono text-base focus:ring-black transition-all"
          />
        </div>

        {/* Discount Type */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">
            Discount Type
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-black/10">
              <SelectItem value="PERCENTAGE">Percentage Off (%)</SelectItem>
              <SelectItem value="FIXED">Fixed Amount (₹)</SelectItem>
              <SelectItem value="FREE_DELIVERY">Free Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Discount Value */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">
            Discount Value
          </Label>
          <div className="relative">
            <Input
              name="value"
              type="number"
              step="0.01"
              defaultValue={discount ? Number(discount.value) : ""}
              required={type !== "FREE_DELIVERY"}
              placeholder="0"
              className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-black/30 pointer-events-none">
              {type === "PERCENTAGE" ? "%" : "₹"}
            </span>
          </div>
        </div>

        {/* Min Order Value */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">
            Min Order Value (₹)
          </Label>
          <Input
            name="minOrderValue"
            type="number"
            placeholder="No minimum"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
            defaultValue={
              discount?.minOrderValue ? Number(discount.minOrderValue) : ""
            }
          />
        </div>

        {/* Usage Limit */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">
            Usage Limit
          </Label>
          <Input
            name="maxUses"
            type="number"
            placeholder="Unlimited"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
            defaultValue={discount?.maxUses ?? ""}
          />
        </div>

        {/* Expiry Date */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">
            Expiry Date
          </Label>
          <Input
            name="expiresAt"
            type="date"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
            defaultValue={
              discount?.expiresAt
                ? new Date(discount.expiresAt).toISOString().split("T")[0]
                : ""
            }
          />
        </div>

        {/* Active Status */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02] border border-black/5">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold text-black">Active</Label>
              <p className="text-xs text-black/40 font-medium">
                Coupon can be used at checkout
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              className="data-[state=checked]:bg-black"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl bg-black text-white font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-lg shadow-black/10"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : discount ? (
          "Update Coupon"
        ) : (
          "Create Coupon"
        )}
      </Button>
    </form>
  )
}

export function DiscountsClient({ 
  discounts, 
  pageCount, 
  currentPage, 
  totalCount,
  activeType,
  activeActive,
}: { 
  discounts: Discount[]
  pageCount?: number
  currentPage?: number
  totalCount?: number
  activeType?: string
  activeActive?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Discount | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleTypeChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("type")
    } else {
      params.set("type", value)
    }
    params.delete("page")
    router.push(`/admin/discounts?${params.toString()}`)
  }, [router, searchParams])

  const handleActiveChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("active")
    } else {
      params.set("active", value)
    }
    params.delete("page")
    router.push(`/admin/discounts?${params.toString()}`)
  }, [router, searchParams])

  const columns: Column<Discount>[] = [
    {
      key: "code",
      header: "Code",
      cell: (r) => (
        <span className="font-mono font-bold text-black">
          {r.code ? (
            <span className="inline-flex items-center gap-1.5 bg-black/5 px-2 py-0.5 rounded-md text-sm">
              <Tag className="w-3 h-3" />
              {r.code}
            </span>
          ) : (
            <span className="text-black/30 italic">No code</span>
          )}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => (
        <Badge variant="outline" className="font-bold text-xs">
          {r.type === "PERCENTAGE" ? "%" : r.type === "FIXED" ? "₹ Fixed" : "Free Delivery"}
        </Badge>
      ),
    },
    {
      key: "value",
      header: "Discount",
      cell: (r) =>
        r.type === "PERCENTAGE"
          ? <span className="font-bold text-black">{Number(r.value)}% off</span>
          : r.type === "FIXED"
          ? <span className="font-bold text-black">₹{Number(r.value)} off</span>
          : <span className="font-bold text-green-600">Free Delivery</span>,
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
        <Badge variant={r.isActive ? "default" : "outline"} className={r.isActive ? "bg-black text-white" : "text-black/40"}>
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
          <h2 className="text-xl font-bold text-black">Coupon Codes</h2>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">
            {totalCount ?? discounts.length} total coupons
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
          className="h-11 px-6 rounded-xl bg-black text-white font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-lg shadow-black/10"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Coupon
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
          searchable
          serverSide={true}
          pageCount={pageCount}
          currentPage={currentPage}
          totalCount={totalCount}
          searchPlaceholder="Search coupons..."
          emptyMessage="No coupons found. Add one to get started."
          filterSlot={
            <div className="flex gap-2">
              <Select value={activeType ?? "all"} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[160px] h-10 rounded-xl border-black/10 bg-white text-sm font-medium">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={activeActive ?? "all"} onValueChange={handleActiveChange}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl border-black/10 bg-white text-sm font-medium">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl rounded-3xl border-black/10 bg-white p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-bold text-black tracking-tight">
              {editing ? "Edit Coupon" : "Create New Coupon"}
            </DialogTitle>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mt-1">
              Configure discount code and conditions
            </p>
          </DialogHeader>
          <DiscountForm
            discount={editing}
            onSubmit={async (fd) => {
              editing
                ? await updateDiscountAction(editing.id, fd)
                : await createDiscountAction(fd)
              toast.success(editing ? "Coupon updated" : "Coupon created")
              setDialogOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-black/10 bg-white p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-black">Delete Coupon?</AlertDialogTitle>
            <AlertDialogDescription className="text-black/60">
              This will permanently delete this coupon. Any orders that used it will be unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-xl border-black/10 hover:bg-black/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteId) return
                await deleteDiscountAction(deleteId)
                toast.success("Coupon deleted")
                setDeleteId(null)
                router.refresh()
              }}
            >
              Delete Coupon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
