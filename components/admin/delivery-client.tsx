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
  applyStateRatesToPincodesAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, Upload, MapPin, Globe, Info } from "lucide-react"
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

type PincodeState = {
  state: string
  pincodeCount: number
  commonBasePrice: number | null
  commonPricePerKg: number | null
}

const TABS = [
  { id: "pincode", label: "Pincode", icon: MapPin },
  { id: "state", label: "State", icon: MapPin },
  { id: "international", label: "International", icon: Globe },
] as const

// ─── Pincode Form ─────────────────────────────────────────────────────────────

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Pincode</Label>
          <Input
            name="pincode"
            defaultValue={pincode?.pincode ?? ""}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
            pattern="\d{6}"
            required
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] font-mono text-base focus:ring-black transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">City</Label>
          <Input
            name="city"
            defaultValue={pincode?.city ?? ""}
            placeholder="e.g. Mumbai"
            required
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">State</Label>
          <Input
            name="state"
            defaultValue={pincode?.state ?? ""}
            placeholder="e.g. Maharashtra"
            required
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Base Price (₹)</Label>
          <Input
            name="basePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={pincode?.basePrice ?? ""}
            required
            placeholder="0.00"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Price per Kg (₹)</Label>
          <Input
            name="pricePerKg"
            type="number"
            step="0.01"
            min="0"
            defaultValue={pincode?.pricePerKg ?? ""}
            required
            placeholder="0.00"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Free Shipping Above (₹)</Label>
          <Input
            name="freeAboveValue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={pincode?.freeAboveValue ?? ""}
            placeholder="Leave empty to disable"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">COD Available</Label>
          <div className="flex items-center gap-3 h-11">
            <input
              type="checkbox"
              name="codAvailable"
              id="codAvailablePincode"
              defaultChecked={pincode?.codAvailable ?? false}
              value="true"
              className="w-5 h-5 rounded accent-black"
            />
            <Label htmlFor="codAvailablePincode" className="text-sm text-black/60 cursor-pointer font-medium">
              Cash on Delivery available
            </Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Active</Label>
          <div className="flex items-center gap-3 h-11">
            <input type="hidden" name="isActive" value="false" />
            <input
              type="checkbox"
              name="isActive"
              id="isActivePincode"
              defaultChecked={pincode?.isActive ?? true}
              value="true"
              className="w-5 h-5 rounded accent-black"
            />
            <Label htmlFor="isActivePincode" className="text-sm text-black/60 cursor-pointer font-medium">
              Serviceable (delivery enabled)
            </Label>
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 rounded-xl border-black/10 font-bold uppercase tracking-widest text-sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-12 rounded-xl bg-black text-white font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-lg shadow-black/10"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : pincode ? "Update Pincode" : "Add Pincode"}
        </Button>
      </div>
    </form>
  )
}

// ─── State Delivery Form ───────────────────────────────────────────────────────

function StateDeliveryForm({
  stateDelivery,
  pincodeStates,
  existingStateNames,
  onSubmit,
  onCancel,
}: {
  stateDelivery?: StateDelivery | null
  pincodeStates: PincodeState[]
  existingStateNames: string[]
  onSubmit: (fd: FormData, applyToDistricts: boolean) => Promise<void>
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [applyToDistricts, setApplyToDistricts] = useState(false)
  const [selectedState, setSelectedState] = useState(stateDelivery?.state ?? "")

  // Filter: when adding new, exclude states already in StateDelivery
  const availableStates = stateDelivery
    ? pincodeStates // Editing: show all
    : pincodeStates.filter((ps) => !existingStateNames.includes(ps.state))

  const selectedInfo = pincodeStates.find((ps) => ps.state === selectedState)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    // Ensure the state value is set from the select
    fd.set("state", selectedState)
    await onSubmit(fd, applyToDistricts)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* State Name — smart dropdown */}
        <div className="md:col-span-2 space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">State Name</Label>
          {stateDelivery ? (
            // Editing: show current state as text + hidden input
            <>
              <input type="hidden" name="state" value={selectedState} />
              <div className="h-11 rounded-xl border border-black/10 bg-black/[0.04] px-4 flex items-center text-base font-medium text-black/70">
                {stateDelivery.state}
              </div>
            </>
          ) : availableStates.length > 0 ? (
            <Select value={selectedState} onValueChange={setSelectedState} required>
              <SelectTrigger className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base">
                <SelectValue placeholder="Select a state..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-black/10 max-h-72">
                {availableStates.map((ps) => (
                  <SelectItem key={ps.state} value={ps.state}>
                    <span className="flex items-center gap-3">
                      <span className="font-medium">{ps.state}</span>
                      <span className="text-xs text-black/40">
                        {ps.pincodeCount} pincode{ps.pincodeCount !== 1 ? "s" : ""}
                        {ps.commonBasePrice !== null ? ` · ₹${ps.commonBasePrice} base` : ""}
                        {ps.commonPricePerKg !== null ? ` + ₹${ps.commonPricePerKg}/kg` : ""}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            // Fallback: free text if no pincode states available
            <Input
              name="state"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              placeholder="e.g. Maharashtra"
              required
              className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
            />
          )}
          {selectedInfo && (
            <div className="flex items-start gap-2 mt-1.5 text-xs text-black/50 font-medium bg-black/[0.02] rounded-lg px-3 py-2">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-black/30" />
              <span>
                {selectedInfo.pincodeCount} pincodes in this state.
                {selectedInfo.commonBasePrice !== null && selectedInfo.commonPricePerKg !== null
                  ? ` All share ₹${selectedInfo.commonBasePrice} base + ₹${selectedInfo.commonPricePerKg}/kg.`
                  : " Pincodes have mixed rates."}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Base Price (₹)</Label>
          <Input
            name="basePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={stateDelivery?.basePrice ?? selectedInfo?.commonBasePrice ?? ""}
            required
            placeholder="0.00"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Price per Kg (₹)</Label>
          <Input
            name="pricePerKg"
            type="number"
            step="0.01"
            min="0"
            defaultValue={stateDelivery?.pricePerKg ?? selectedInfo?.commonPricePerKg ?? ""}
            required
            placeholder="0.00"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Free Shipping Above (₹)</Label>
          <Input
            name="freeAboveValue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={stateDelivery?.freeAboveValue ?? ""}
            placeholder="Leave empty to disable"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">COD Available</Label>
          <div className="flex items-center gap-3 h-11">
            <input
              type="checkbox"
              name="codAvailable"
              id="codAvailableState"
              defaultChecked={stateDelivery?.codAvailable ?? false}
              value="true"
              className="w-5 h-5 rounded accent-black"
            />
            <Label htmlFor="codAvailableState" className="text-sm text-black/60 cursor-pointer font-medium">
              Cash on Delivery available
            </Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Active</Label>
          <div className="flex items-center gap-3 h-11">
            <input type="hidden" name="isActive" value="false" />
            <input
              type="checkbox"
              name="isActive"
              id="isActiveState"
              defaultChecked={stateDelivery?.isActive ?? true}
              value="true"
              className="w-5 h-5 rounded accent-black"
            />
            <Label htmlFor="isActiveState" className="text-sm text-black/60 cursor-pointer font-medium">
              Serviceable (delivery enabled)
            </Label>
          </div>
        </div>
      </div>

      {/* Apply to all districts checkbox */}
      {selectedState && (
        <div className={cn(
          "flex items-start gap-3 p-4 rounded-xl border transition-all",
          applyToDistricts ? "border-black/20 bg-black/[0.03]" : "border-black/5 bg-black/[0.01]"
        )}>
          <input
            type="checkbox"
            id="applyToDistricts"
            checked={applyToDistricts}
            onChange={(e) => setApplyToDistricts(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded accent-black shrink-0"
          />
          <div>
            <Label htmlFor="applyToDistricts" className="text-sm font-bold text-black cursor-pointer">
              Apply rates to all pincodes in {selectedState}
            </Label>
            <p className="text-xs text-black/40 font-medium mt-0.5">
              Updates all {selectedInfo?.pincodeCount ?? "matching"} pincodes in this state to use the same rates above
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 rounded-xl border-black/10 font-bold uppercase tracking-widest text-sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || (!stateDelivery && !selectedState)}
          className="flex-1 h-12 rounded-xl bg-black text-white font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-lg shadow-black/10"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stateDelivery ? "Update State" : "Add State"}
        </Button>
      </div>
    </form>
  )
}

// ─── International Delivery Form ──────────────────────────────────────────────

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Country Name</Label>
          <Input
            name="country"
            defaultValue={internationalDelivery?.country ?? ""}
            placeholder="e.g. United States"
            required
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Country Code (ISO)</Label>
          <Input
            name="countryCode"
            defaultValue={internationalDelivery?.countryCode ?? ""}
            placeholder="e.g. US"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Base Price (₹)</Label>
          <Input
            name="basePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={internationalDelivery?.basePrice ?? ""}
            required
            placeholder="0.00"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Price per Kg (₹)</Label>
          <Input
            name="pricePerKg"
            type="number"
            step="0.01"
            min="0"
            defaultValue={internationalDelivery?.pricePerKg ?? ""}
            required
            placeholder="0.00"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Free Shipping Above (₹)</Label>
          <Input
            name="freeAboveValue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={internationalDelivery?.freeAboveValue ?? ""}
            placeholder="Leave empty to disable"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Delivery Time</Label>
          <Input
            name="deliveryDays"
            defaultValue={internationalDelivery?.deliveryDays ?? ""}
            placeholder="e.g. 7-14 days"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all text-base"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Active</Label>
          <div className="flex items-center gap-3 h-11">
            <input type="hidden" name="isActive" value="false" />
            <input
              type="checkbox"
              name="isActive"
              id="isActiveIntl"
              defaultChecked={internationalDelivery?.isActive ?? true}
              value="true"
              className="w-5 h-5 rounded accent-black"
            />
            <Label htmlFor="isActiveIntl" className="text-sm text-black/60 cursor-pointer font-medium">
              Serviceable (delivery enabled)
            </Label>
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 rounded-xl border-black/10 font-bold uppercase tracking-widest text-sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-12 rounded-xl bg-black text-white font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-lg shadow-black/10"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : internationalDelivery ? "Update Country" : "Add Country"}
        </Button>
      </div>
    </form>
  )
}

// ─── Bulk Import Form ─────────────────────────────────────────────────────────

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">
          Pincodes (comma or newline separated)
        </Label>
        <textarea
          name="pincodes"
          required
          placeholder={"400001, 400002, 400003\n400004, 400005"}
          rows={5}
          className="w-full rounded-xl border border-black/10 bg-black/[0.02] p-4 font-mono text-base focus:ring-black transition-all resize-none text-black"
        />
        <p className="text-xs text-black/40 ml-1">Enter 6-digit pincodes separated by commas or newlines</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">City</Label>
          <Input name="city" placeholder="e.g. Mumbai" required className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">State</Label>
          <Input name="state" placeholder="e.g. Maharashtra" required className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Base Price (₹)</Label>
          <Input name="basePrice" type="number" step="0.01" min="0" required placeholder="0.00" className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Price per Kg (₹)</Label>
          <Input name="pricePerKg" type="number" step="0.01" min="0" required placeholder="0.00" className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">Free Shipping Above (₹)</Label>
          <Input name="freeAboveValue" type="number" step="0.01" min="0" placeholder="Leave empty to disable" className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">COD Available</Label>
          <div className="flex items-center gap-3 h-11">
            <input type="checkbox" name="codAvailable" value="true" className="w-5 h-5 rounded accent-black" />
            <Label className="text-sm text-black/60 font-medium cursor-pointer">Cash on Delivery</Label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-xl border-black/10 font-bold uppercase tracking-widest text-sm">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-black text-white font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Import Pincodes"}
        </Button>
      </div>
    </form>
  )
}

// ─── Main Client Component ─────────────────────────────────────────────────────

export function DeliveryClient({ 
  pincodes, 
  stateDeliveries,
  internationalDeliveries,
  pincodeStates = [],
  pageCount, 
  currentPage, 
  totalCount,
  activeTab = "pincode",
}: { 
  pincodes: DeliveryPincode[]
  stateDeliveries: StateDelivery[]
  internationalDeliveries: InternationalDelivery[]
  pincodeStates?: PincodeState[]
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
  const existingStateNames = stateDeliveries.map((s) => s.state)

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
    { key: "basePrice", header: "Base Price", cell: (r) => `₹${r.basePrice}` },
    { key: "pricePerKg", header: "Per Kg", cell: (r) => `₹${r.pricePerKg}` },
    { key: "freeAboveValue", header: "Free Above", cell: (r) => r.freeAboveValue ? `₹${r.freeAboveValue}` : "—" },
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
          <Button size="icon" variant="ghost" onClick={() => { setEditingPincode(r); setDialogOpen(true) }}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setDeleteId(r.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const stateColumns: Column<StateDelivery>[] = [
    { key: "state", header: "State", cell: (r) => <span className="font-bold">{r.state}</span> },
    { key: "basePrice", header: "Base Price", cell: (r) => `₹${r.basePrice}` },
    { key: "pricePerKg", header: "Per Kg", cell: (r) => `₹${r.pricePerKg}` },
    { key: "freeAboveValue", header: "Free Above", cell: (r) => r.freeAboveValue ? `₹${r.freeAboveValue}` : "—" },
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
          <Button size="icon" variant="ghost" onClick={() => { setEditingState(r); setDialogOpen(true) }}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setDeleteId(r.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const internationalColumns: Column<InternationalDelivery>[] = [
    { key: "country", header: "Country", cell: (r) => <span className="font-bold">{r.country}</span> },
    { key: "countryCode", header: "Code", cell: (r) => r.countryCode || "—" },
    { key: "basePrice", header: "Base Price", cell: (r) => `₹${r.basePrice}` },
    { key: "pricePerKg", header: "Per Kg", cell: (r) => `₹${r.pricePerKg}` },
    { key: "freeAboveValue", header: "Free Above", cell: (r) => r.freeAboveValue ? `₹${r.freeAboveValue}` : "—" },
    { key: "deliveryDays", header: "Delivery Time", cell: (r) => r.deliveryDays || "—" },
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
          <Button size="icon" variant="ghost" onClick={() => { setEditingInternational(r); setDialogOpen(true) }}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setDeleteId(r.id)}>
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
      case "state": return "No states configured. Click 'Add State' to set state-level delivery rates."
      case "international": return "No international locations configured."
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
      case "state": return "Configure delivery rates for an entire state"
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
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-black/10 pb-4">
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
                  ? "bg-black text-white"
                  : "text-black/50 hover:bg-black/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-black">{getTitle()}</h2>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">
            {currentTab === "state"
              ? `${stateDeliveries.length} states configured`
              : currentTab === "international"
              ? `${internationalDeliveries.length} countries configured`
              : `${pincodes.length} pincodes configured`}
          </p>
        </div>
        <div className="flex gap-3">
          {currentTab === "pincode" && (
            <>
              <Button
                onClick={async () => {
                  if (confirm("Reset ALL pincode delivery rates to 0?")) {
                    const res = await resetAllDeliveryRatesAction()
                    toast.success(`Reset rates for ${res.updated} pincodes`)
                  }
                }}
                variant="destructive"
                className="h-11 px-5 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-90 shadow-lg"
              >
                Reset All Rates
              </Button>
              <Button
                onClick={() => setBulkDialogOpen(true)}
                variant="outline"
                className="h-11 px-5 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-black/5 border-black/10"
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
            className="h-11 px-5 rounded-xl bg-black text-white font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-lg shadow-black/10"
          >
            <Plus className="w-4 h-4 mr-2" /> Add {currentTab === "pincode" ? "Pincode" : currentTab === "state" ? "State" : "Country"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        <DataTable
          columns={(getColumns() as any[]).map(col => ({
            ...col,
            header: (
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">
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
          searchPlaceholder={
            currentTab === "international"
              ? "Search countries..."
              : currentTab === "state"
              ? "Search states..."
              : "Search pincodes, cities, states..."
          }
          emptyMessage={getEmptyMessage()}
        />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-black/10 bg-white p-8 [&>button]:hidden">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-black tracking-tight">
              {currentTab === "state"
                ? (editingState ? "Edit State Delivery" : "Add State Delivery")
                : currentTab === "international"
                ? (editingInternational ? "Edit Country" : "Add Country")
                : (editingPincode ? "Edit Pincode" : "Add Pincode")}
            </DialogTitle>
            <p className="text-xs font-bold uppercase tracking-widest text-black/40 mt-1">{getSubtitle()}</p>
          </DialogHeader>

          {currentTab === "state" ? (
            <StateDeliveryForm
              stateDelivery={editingState}
              pincodeStates={pincodeStates}
              existingStateNames={existingStateNames}
              onSubmit={async (fd, applyToDistricts) => {
                const state = fd.get("state") as string
                const basePrice = parseFloat(fd.get("basePrice") as string)
                const pricePerKg = parseFloat(fd.get("pricePerKg") as string)
                const freeAboveValue = fd.get("freeAboveValue") ? parseFloat(fd.get("freeAboveValue") as string) : undefined
                const codAvailable = fd.get("codAvailable") === "true"

                if (editingState) {
                  await updateStateDeliveryAction(editingState.id, fd)
                  toast.success("State delivery updated")
                } else {
                  await createStateDeliveryAction(fd)
                  toast.success("State delivery added")
                }

                // Apply to all pincodes in this state if checkbox was checked
                if (applyToDistricts && state) {
                  const applyFd = new FormData()
                  applyFd.set("state", state)
                  applyFd.set("basePrice", String(basePrice))
                  applyFd.set("pricePerKg", String(pricePerKg))
                  if (freeAboveValue !== undefined) applyFd.set("freeAboveValue", String(freeAboveValue))
                  if (codAvailable) applyFd.set("codAvailable", "true")
                  const result = await applyStateRatesToPincodesAction(applyFd)
                  if ("updated" in result) {
                    toast.success(`Applied rates to ${result.updated} pincode${result.updated !== 1 ? "s" : ""} in ${state}`)
                  }
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

      {/* Bulk Import Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-black/10 bg-white p-8 [&>button]:hidden">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-black tracking-tight">
              Bulk Import Pincodes
            </DialogTitle>
            <p className="text-xs font-bold uppercase tracking-widest text-black/40 mt-1">
              Import multiple pincodes at once with the same delivery settings
            </p>
          </DialogHeader>
          <BulkImportForm
            onSuccess={(result) => {
              toast.success(`Imported ${result.created} pincodes${result.skipped > 0 ? `, ${result.skipped} skipped` : ""}`)
              setBulkDialogOpen(false)
              router.refresh()
            }}
            onCancel={() => setBulkDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-black/10 bg-white p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-black">
              Delete {currentTab === "state" ? "State" : currentTab === "international" ? "Country" : "Pincode"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black/60">
              {currentTab === "state"
                ? "This removes the state-level delivery configuration. Individual pincodes will not be affected."
                : currentTab === "international"
                ? "Delivery to this country will no longer be available."
                : "Delivery to this pincode will no longer be available."}
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