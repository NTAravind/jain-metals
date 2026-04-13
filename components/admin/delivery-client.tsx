"use client"

import { useState } from "react"
import {
  createDeliveryPincodeAction,
  updateDeliveryPincodeAction,
  deleteDeliveryPincodeAction,
  bulkCreateDeliveryPincodesAction,
} from "@/actions/delivery"
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
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, Upload, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

type DeliveryPincode = {
  id: string
  pincode: string
  city: string
  state: string
  codAvailable: boolean
  basePrice: number
  pricePerKg: number
  freeAboveValue: number | null
  isActive: boolean
}

function PincodeForm({
  pincode,
  onSubmit,
}: {
  pincode?: DeliveryPincode | null
  onSubmit: (fd: FormData) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await onSubmit(fd)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">Pincode</Label>
          <Input
            name="pincode"
            defaultValue={pincode?.pincode ?? ""}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
            pattern="\d{6}"
            required
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] font-mono text-base focus:ring-black dark:focus:ring-white transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">City</Label>
          <Input
            name="city"
            defaultValue={pincode?.city ?? ""}
            placeholder="e.g. Mumbai"
            required
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] focus:ring-black dark:focus:ring-white transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">State</Label>
          <Input
            name="state"
            defaultValue={pincode?.state ?? ""}
            placeholder="e.g. Maharashtra"
            required
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] focus:ring-black dark:focus:ring-white transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">Base Price (₹)</Label>
          <Input
            name="basePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={pincode?.basePrice ?? ""}
            required
            placeholder="0.00"
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] focus:ring-black dark:focus:ring-white transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">Price per Kg (₹)</Label>
          <Input
            name="pricePerKg"
            type="number"
            step="0.01"
            min="0"
            defaultValue={pincode?.pricePerKg ?? ""}
            required
            placeholder="0.00"
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] focus:ring-black dark:focus:ring-white transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">Free Shipping Above (₹)</Label>
          <Input
            name="freeAboveValue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={pincode?.freeAboveValue ?? ""}
            placeholder="Leave empty for no free shipping"
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] focus:ring-black dark:focus:ring-white transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">COD Available</Label>
          <div className="flex items-center gap-3 h-12">
            <input
              type="checkbox"
              name="codAvailable"
              id="codAvailable"
              defaultChecked={pincode?.codAvailable ?? false}
              value="true"
              className="w-5 h-5 rounded accent-black dark:accent-white"
            />
            <Label htmlFor="codAvailable" className="text-sm text-black/60 dark:text-white/60 cursor-pointer">
              Cash on Delivery available
            </Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">Active</Label>
          <div className="flex items-center gap-3 h-12">
            <input
              type="hidden"
              name="isActive"
              value="false"
            />
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              defaultChecked={pincode?.isActive ?? true}
              value="true"
              className="w-5 h-5 rounded accent-black dark:accent-white"
            />
            <Label htmlFor="isActive" className="text-sm text-black/60 dark:text-white/60 cursor-pointer">
              Serviceable for delivery
            </Label>
          </div>
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-xl shadow-black/10 dark:shadow-white/10 mt-4"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : pincode ? (
          "Update Pincode"
        ) : (
          "Add Pincode"
        )}
      </Button>
    </form>
  )
}

function BulkImportForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (result: { created: number; skipped: number }) => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      const result = await bulkCreateDeliveryPincodesAction(fd)
      onSuccess(result)
    } catch (err: any) {
      toast.error(err.message || "Failed to import pincodes")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">
          Pincodes (comma or newline separated)
        </Label>
        <textarea
          name="pincodes"
          required
          placeholder="400001, 400002, 400003&#10;400004, 400005"
          rows={5}
          className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 font-mono text-base focus:ring-black dark:focus:ring-white transition-all resize-none"
        />
        <p className="text-xs text-black/40 dark:text-white/40 ml-1">Enter 6-digit pincodes separated by commas or newlines</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">City</Label>
          <Input
            name="city"
            placeholder="e.g. Mumbai"
            required
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] focus:ring-black dark:focus:ring-white transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">State</Label>
          <Input
            name="state"
            placeholder="e.g. Maharashtra"
            required
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] focus:ring-black dark:focus:ring-white transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">Base Price (₹)</Label>
          <Input
            name="basePrice"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] focus:ring-black dark:focus:ring-white transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">Price per Kg (₹)</Label>
          <Input
            name="pricePerKg"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] focus:ring-black dark:focus:ring-white transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">Free Shipping Above (₹)</Label>
          <Input
            name="freeAboveValue"
            type="number"
            step="0.01"
            min="0"
            placeholder="Leave empty for no free shipping"
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] focus:ring-black dark:focus:ring-white transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">COD Available</Label>
          <div className="flex items-center gap-3 h-12">
            <input
              type="checkbox"
              name="codAvailable"
              value="true"
              className="w-5 h-5 rounded accent-black dark:accent-white"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-14 rounded-2xl border-black/10 dark:border-white/10 font-bold uppercase tracking-widest text-sm"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading} 
          className="flex-1 h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Import Pincodes"
          )}
        </Button>
      </div>
    </form>
  )
}

export function DeliveryClient({ pincodes }: { pincodes: DeliveryPincode[] }) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DeliveryPincode | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<DeliveryPincode>[] = [
    { 
      key: "pincode", 
      header: "Pincode", 
      cell: (r) => (
        <span className="font-mono font-bold text-brand-navy">{r.pincode}</span>
      )
    },
    { key: "city", header: "City", cell: (r) => r.city },
    { key: "state", header: "State", cell: (r) => r.state },
    {
      key: "basePrice",
      header: "Base Price",
      cell: (r) => `₹${r.basePrice}`,
    },
    {
      key: "pricePerKg",
      header: "Per Kg",
      cell: (r) => `₹${r.pricePerKg}`,
    },
    {
      key: "freeAboveValue",
      header: "Free Above",
      cell: (r) => r.freeAboveValue ? `₹${r.freeAboveValue}` : "—",
    },
    {
      key: "codAvailable",
      header: "COD",
      cell: (r) => (
        <Badge variant={r.codAvailable ? "default" : "outline"} className="font-bold">
          {r.codAvailable ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (r) => (
        <Badge variant={r.isActive ? "default" : "destructive"}>
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-black dark:text-white">Pincode Delivery Configuration</h2>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
            {pincodes.length} pincodes configured
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setBulkDialogOpen(true)}
            variant="outline"
            className="h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-black/5 dark:hover:bg-white/5 border-black/10 dark:border-white/10"
          >
            <Upload className="w-4 h-4 mr-2" /> Bulk Import
          </Button>
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
            className="h-12 px-6 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl shadow-black/10 dark:shadow-white/10"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Pincode
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
        <DataTable
          columns={columns.map(col => ({
            ...col,
            header: (
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
                {col.header as string}
              </span>
            )
          }))}
          data={pincodes}
          searchable
          searchPlaceholder="Search pincodes, cities, states..."
          searchKeys={["pincode", "city", "state"]}
          emptyMessage="No pincodes configured. Add pincodes to enable delivery."
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-black dark:text-white tracking-tight">
              {editing ? "Edit Pincode" : "Add Pincode"}
            </DialogTitle>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 dark:text-white/30 mt-1">
              Configure delivery for a specific pincode
            </p>
          </DialogHeader>
          <PincodeForm
            pincode={editing}
            onSubmit={async (fd) => {
              editing
                ? await updateDeliveryPincodeAction(editing.id, fd)
                : await createDeliveryPincodeAction(fd)
              toast.success(editing ? "Pincode updated" : "Pincode added")
              setDialogOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-black dark:text-white tracking-tight">
              Bulk Import Pincodes
            </DialogTitle>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 dark:text-white/30 mt-1">
              Import multiple pincodes at once with same delivery settings
            </p>
          </DialogHeader>
          <BulkImportForm
            onSuccess={(result) => {
              toast.success(`Imported ${result.created} pincodes${result.skipped > 0 ? `, ${result.skipped} skipped (already exist)` : ""}`)
              setBulkDialogOpen(false)
              router.refresh()
            }}
            onCancel={() => setBulkDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-black dark:text-white">Delete Pincode?</AlertDialogTitle>
            <AlertDialogDescription className="text-black/60 dark:text-white/60">
              This will remove the pincode configuration. Delivery to this pincode will no longer be available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-xl border-black/10 hover:bg-black/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteId) return
                await deleteDeliveryPincodeAction(deleteId)
                toast.success("Pincode deleted")
                setDeleteId(null)
                router.refresh()
              }}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
