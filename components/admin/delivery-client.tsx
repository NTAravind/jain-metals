"use client"

import { useState } from "react"
import {
  createDeliveryPincodeAction,
  updateDeliveryPincodeAction,
  deleteDeliveryPincodeAction,
  bulkCreateDeliveryPincodesAction,
  resetAllDeliveryRatesAction,
  createStateDeliveryAction,
  updateStateDeliveryAction,
  deleteStateDeliveryAction,
  createInternationalDeliveryAction,
  updateInternationalDeliveryAction,
  deleteInternationalDeliveryAction,
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
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, Upload, MapPin, Globe } from "lucide-react"
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

type StateDelivery = {
  id: string
  state: string
  codAvailable: boolean
  basePrice: number
  pricePerKg: number
  freeAboveValue: number | null
  isActive: boolean
}

type InternationalDelivery = {
  id: string
  country: string
  countryCode: string | null
  basePrice: number
  pricePerKg: number
  freeAboveValue: number | null
  deliveryDays: string | null
  isActive: boolean
}

const TABS = [
  { id: "pincode", label: "Pincode", icon: MapPin },
  { id: "state", label: "State", icon: MapPin },
  { id: "international", label: "International", icon: Globe },
] as const

function PincodeForm({
  pincode,
  onSubmit,
  onCancel,
}: {
  pincode?: DeliveryPincode | null
  onSubmit: (fd: FormData) => Promise<void>
  onCancel: () => void
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
              id="codAvailablePincode"
              defaultChecked={pincode?.codAvailable ?? false}
              value="true"
              className="w-5 h-5 rounded accent-black dark:accent-white"
            />
            <Label htmlFor="codAvailablePincode" className="text-sm text-black/60 dark:text-white/60 cursor-pointer">
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
              id="isActivePincode"
              defaultChecked={pincode?.isActive ?? true}
              value="true"
              className="w-5 h-5 rounded accent-black dark:accent-white"
            />
            <Label htmlFor="isActivePincode" className="text-sm text-black/60 dark:text-white/60 cursor-pointer">
              Serviceable for delivery
            </Label>
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
          className="flex-1 h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-xl shadow-black/10 dark:shadow-white/10 mt-4"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : pincode ? (
            "Update Pincode"
          ) : (
            "Add Pincode"
          )}
        </Button>
      </div>
    </form>
  )
}

function StateDeliveryForm({
  stateDelivery,
  onSubmit,
  onCancel,
}: {
  stateDelivery?: StateDelivery | null
  onSubmit: (fd: FormData) => Promise<void>
  onCancel: () => void
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
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">State Name</Label>
          <Input
            name="state"
            defaultValue={stateDelivery?.state ?? ""}
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
            defaultValue={stateDelivery?.basePrice ?? ""}
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
            defaultValue={stateDelivery?.pricePerKg ?? ""}
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
            defaultValue={stateDelivery?.freeAboveValue ?? ""}
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
              id="codAvailableState"
              defaultChecked={stateDelivery?.codAvailable ?? false}
              value="true"
              className="w-5 h-5 rounded accent-black dark:accent-white"
            />
            <Label htmlFor="codAvailableState" className="text-sm text-black/60 dark:text-white/60 cursor-pointer">
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
              id="isActiveState"
              defaultChecked={stateDelivery?.isActive ?? true}
              value="true"
              className="w-5 h-5 rounded accent-black dark:accent-white"
            />
            <Label htmlFor="isActiveState" className="text-sm text-black/60 dark:text-white/60 cursor-pointer">
              Serviceable for delivery
            </Label>
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
          className="flex-1 h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-xl shadow-black/10 dark:shadow-white/10 mt-4"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : stateDelivery ? (
            "Update State"
          ) : (
            "Add State"
          )}
        </Button>
      </div>
    </form>
  )
}

function InternationalDeliveryForm({
  internationalDelivery,
  onSubmit,
  onCancel,
}: {
  internationalDelivery?: InternationalDelivery | null
  onSubmit: (fd: FormData) => Promise<void>
  onCancel: () => void
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
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">Country Name</Label>
          <Input
            name="country"
            defaultValue={internationalDelivery?.country ?? ""}
            placeholder="e.g. United States"
            required
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] focus:ring-black dark:focus:ring-white transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">Country Code (ISO)</Label>
          <Input
            name="countryCode"
            defaultValue={internationalDelivery?.countryCode ?? ""}
            placeholder="e.g. US"
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
            defaultValue={internationalDelivery?.basePrice ?? ""}
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
            defaultValue={internationalDelivery?.pricePerKg ?? ""}
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
            defaultValue={internationalDelivery?.freeAboveValue ?? ""}
            placeholder="Leave empty for no free shipping"
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] focus:ring-black dark:focus:ring-white transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 ml-1">Delivery Time</Label>
          <Input
            name="deliveryDays"
            defaultValue={internationalDelivery?.deliveryDays ?? ""}
            placeholder="e.g. 5-7 days"
            className="h-12 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] focus:ring-black dark:focus:ring-white transition-all text-base"
          />
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
              id="isActiveIntl"
              defaultChecked={internationalDelivery?.isActive ?? true}
              value="true"
              className="w-5 h-5 rounded accent-black dark:accent-white"
            />
            <Label htmlFor="isActiveIntl" className="text-sm text-black/60 dark:text-white/60 cursor-pointer">
              Serviceable for delivery
            </Label>
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
          className="flex-1 h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-xl shadow-black/10 dark:shadow-white/10 mt-4"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : internationalDelivery ? (
            "Update Country"
          ) : (
            "Add Country"
          )}
        </Button>
      </div>
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

export function DeliveryClient({ 
  pincodes, 
  stateDeliveries,
  internationalDeliveries,
  pageCount, 
  currentPage, 
  totalCount,
  activeTab = "pincode",
}: { 
  pincodes: DeliveryPincode[]
  stateDeliveries: StateDelivery[]
  internationalDeliveries: InternationalDelivery[]
  pageCount?: number
  currentPage?: number
  totalCount?: number
  activeTab?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [editingPincode, setEditingPincode] = useState<DeliveryPincode | null>(null)
  const [editingState, setEditingState] = useState<StateDelivery | null>(null)
  const [editingInternational, setEditingInternational] = useState<InternationalDelivery | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const currentTab = activeTab

  const pincodeColumns: Column<DeliveryPincode>[] = [
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
              setEditingPincode(r)
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

  const stateColumns: Column<StateDelivery>[] = [
    { key: "state", header: "State", cell: (r) => <span className="font-bold">{r.state}</span> },
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
              setEditingState(r)
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

  const internationalColumns: Column<InternationalDelivery>[] = [
    { key: "country", header: "Country", cell: (r) => <span className="font-bold">{r.country}</span> },
    { key: "countryCode", header: "Code", cell: (r) => r.countryCode || "—" },
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
      key: "deliveryDays",
      header: "Delivery Time",
      cell: (r) => r.deliveryDays || "—",
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
              setEditingInternational(r)
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

  const getColumns = () => {
    switch (currentTab) {
      case "state": return stateColumns
      case "international": return internationalColumns
      default: return pincodeColumns
    }
  }

  const getData = () => {
    switch (currentTab) {
      case "state": return stateDeliveries
      case "international": return internationalDeliveries
      default: return pincodes
    }
  }

  const getEmptyMessage = () => {
    switch (currentTab) {
      case "state": return "No states configured. Add states to enable delivery pricing."
      case "international": return "No international locations configured. Add countries to enable international delivery."
      default: return "No pincodes configured. Add pincodes to enable delivery."
    }
  }

  const getTitle = () => {
    switch (currentTab) {
      case "state": return "State Delivery Configuration"
      case "international": return "International Delivery Configuration"
      default: return "Pincode Delivery Configuration"
    }
  }

  const getSubtitle = () => {
    switch (currentTab) {
      case "state": return "Configure delivery for all pincodes in a state"
      case "international": return "Configure international delivery charges by country"
      default: return "Configure delivery for a specific pincode"
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    if (currentTab === "state") {
      await deleteStateDeliveryAction(deleteId)
      toast.success("State delivery deleted")
    } else if (currentTab === "international") {
      await deleteInternationalDeliveryAction(deleteId)
      toast.success("International delivery deleted")
    } else {
      await deleteDeliveryPincodeAction(deleteId)
      toast.success("Pincode deleted")
    }
    setDeleteId(null)
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-4">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set("tab", tab.id)
                router.push(`/admin/delivery?${params.toString()}`)
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase tracking-widest text-xs transition-all",
                isActive
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-black dark:text-white">{getTitle()}</h2>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
            {currentTab === "state" 
              ? `${stateDeliveries.length} states configured`
              : currentTab === "international"
              ? `${internationalDeliveries.length} countries configured`
              : `${pincodes.length} pincodes configured`
            }
          </p>
        </div>
        <div className="flex gap-3">
          {currentTab === "pincode" && (
            <>
              <Button
                onClick={async () => {
                  if (confirm("Are you sure you want to reset ALL pincode delivery rates to 0?")) {
                    const res = await resetAllDeliveryRatesAction()
                    toast.success(`Reset rates for ${res.updated} pincodes`)
                  }
                }}
                variant="destructive"
                className="h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-90 shadow-xl"
              >
                Reset All Rates
              </Button>
              <Button
                onClick={() => setBulkDialogOpen(true)}
                variant="outline"
                className="h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-black/5 dark:hover:bg-white/5 border-black/10 dark:border-white/10"
              >
                <Upload className="w-4 h-4 mr-2" /> Bulk Import
              </Button>
            </>
          )}
          <Button
            onClick={() => {
              if (currentTab === "state") {
                setEditingState(null)
              } else if (currentTab === "international") {
                setEditingInternational(null)
              } else {
                setEditingPincode(null)
              }
              setDialogOpen(true)
            }}
            className="h-12 px-6 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl shadow-black/10 dark:shadow-white/10"
          >
            <Plus className="w-4 h-4 mr-2" /> Add {currentTab === "pincode" ? "Pincode" : currentTab === "state" ? "State" : "Country"}
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
        <DataTable
          columns={(getColumns() as any[]).map(col => ({
            ...col,
            header: (
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
                {col.header as string}
              </span>
            )
          }))}
          data={getData() as any[]}
          searchable
          serverSide={true}
          pageCount={pageCount}
          currentPage={currentPage}
          totalCount={totalCount}
          searchPlaceholder={currentTab === "international" ? "Search countries..." : currentTab === "state" ? "Search states..." : "Search pincodes, cities, states..."}
          emptyMessage={getEmptyMessage()}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-black dark:text-white tracking-tight">
              {currentTab === "state"
                ? (editingState ? "Edit State" : "Add State")
                : currentTab === "international"
                ? (editingInternational ? "Edit Country" : "Add Country")
                : (editingPincode ? "Edit Pincode" : "Add Pincode")
              }
            </DialogTitle>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 dark:text-white/30 mt-1">
              {getSubtitle()}
            </p>
          </DialogHeader>
          {currentTab === "state" ? (
            <StateDeliveryForm
              stateDelivery={editingState}
              onSubmit={async (fd) => {
                if (editingState) {
                  await updateStateDeliveryAction(editingState.id, fd)
                  toast.success("State delivery updated")
                } else {
                  await createStateDeliveryAction(fd)
                  toast.success("State delivery added")
                }
                setDialogOpen(false)
                router.refresh()
              }}
              onCancel={() => setDialogOpen(false)}
            />
          ) : currentTab === "international" ? (
            <InternationalDeliveryForm
              internationalDelivery={editingInternational}
              onSubmit={async (fd) => {
                if (editingInternational) {
                  await updateInternationalDeliveryAction(editingInternational.id, fd)
                  toast.success("International delivery updated")
                } else {
                  await createInternationalDeliveryAction(fd)
                  toast.success("International delivery added")
                }
                setDialogOpen(false)
                router.refresh()
              }}
              onCancel={() => setDialogOpen(false)}
            />
          ) : (
            <PincodeForm
              pincode={editingPincode}
              onSubmit={async (fd) => {
                if (editingPincode) {
                  await updateDeliveryPincodeAction(editingPincode.id, fd)
                  toast.success("Pincode updated")
                } else {
                  await createDeliveryPincodeAction(fd)
                  toast.success("Pincode added")
                }
                setDialogOpen(false)
                router.refresh()
              }}
              onCancel={() => setDialogOpen(false)}
            />
          )}
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
            <AlertDialogTitle className="text-xl font-bold text-black dark:text-white">
              Delete {currentTab === "state" ? "State" : currentTab === "international" ? "Country" : "Pincode"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black/60 dark:text-white/60">
              This will remove the delivery configuration. {currentTab === "state" 
                ? "All pincodes in this state will need separate configuration."
                : currentTab === "international"
                ? "Delivery to this country will no longer be available."
                : "Delivery to this pincode will no longer be available."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-xl border-black/10 hover:bg-black/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}