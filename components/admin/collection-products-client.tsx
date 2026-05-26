"use client"

import { useState, useTransition, useMemo } from "react"
import {
  setCollectionProductsAction,
  updateCollectionAction,
  applyCollectionDiscountAction,
} from "@/actions/collections"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Search,
  Check,
  Package,
  Loader2,
  CheckSquare,
  Square,
  ArrowLeft,
  X,
  Percent,
  Zap,
  ChevronDown,
  Settings2,
} from "lucide-react"

type Collection = {
  id: string
  name: string
  slug: string
  description: string | null
  isDefault: boolean
  discountPercent: number | null
}

type Product = {
  id: string
  name: string
  sku: string
  images: string[]
  price: number
  discountedPrice: number | null
  category: { name: string } | null
  stock: number
  isActive: boolean
}

export function CollectionProductsClient({
  collection: initialCollection,
  allProducts,
  currentIds,
}: {
  collection: Collection
  allProducts: Product[]
  currentIds: string[]
}) {
  const router = useRouter()

  // ── Products state ──────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set(currentIds))
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "selected" | "unselected">("all")
  const [savingProducts, startSaveProducts] = useTransition()
  const [dirtyProducts, setDirtyProducts] = useState(false)

  // ── Collection settings state ───────────────────────────────────────────────
  const [collection, setCollection] = useState(initialCollection)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editName, setEditName] = useState(collection.name)
  const [editDesc, setEditDesc] = useState(collection.description ?? "")
  const [editDiscount, setEditDiscount] = useState(
    collection.discountPercent != null ? String(collection.discountPercent) : ""
  )
  const [savingSettings, startSaveSettings] = useTransition()
  const [applyingDiscount, startApplyDiscount] = useTransition()

  // ── Derived ─────────────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set(allProducts.map((p) => p.category?.name).filter(Boolean))
    return ["all", ...Array.from(cats)] as string[]
  }, [allProducts])

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      const matchCategory = filterCategory === "all" || p.category?.name === filterCategory
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "selected" && selected.has(p.id)) ||
        (filterStatus === "unselected" && !selected.has(p.id))
      return matchSearch && matchCategory && matchStatus
    })
  }, [allProducts, search, filterCategory, filterStatus, selected])

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id))

  // ── Handlers ────────────────────────────────────────────────────────────────
  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setDirtyProducts(true)
  }

  const selectAll = () => {
    setSelected((prev) => { const n = new Set(prev); filtered.forEach((p) => n.add(p.id)); return n })
    setDirtyProducts(true)
  }

  const deselectAll = () => {
    setSelected((prev) => { const n = new Set(prev); filtered.forEach((p) => n.delete(p.id)); return n })
    setDirtyProducts(true)
  }

  const handleSaveProducts = () => {
    startSaveProducts(async () => {
      const res = await setCollectionProductsAction(collection.id, Array.from(selected))
      if (res.error) toast.error(res.error)
      else {
        toast.success("Products saved")
        setDirtyProducts(false)
        router.push("/admin/collections")
      }
    })
  }

  const handleSaveSettings = () => {
    startSaveSettings(async () => {
      const fd = new FormData()
      fd.set("name", collection.isDefault ? collection.name : editName)
      fd.set("description", editDesc)
      fd.set("discountPercent", editDiscount)
      const res = await updateCollectionAction(collection.id, fd)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Collection updated")
        const updated = {
          ...collection,
          name: collection.isDefault ? collection.name : editName,
          description: editDesc || null,
          discountPercent: editDiscount !== "" ? Number(editDiscount) : null,
        }
        setCollection(updated)
        setSettingsOpen(false)
        router.refresh()
      }
    })
  }

  const handleApplyDiscount = () => {
    startApplyDiscount(async () => {
      const res = await applyCollectionDiscountAction(collection.id)
      if (res.error) toast.error(res.error)
      else {
        toast.success(`Discount applied to ${res.updated} products`)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-5">

      {/* ── Collection Settings Panel ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-black/10 overflow-hidden shadow-sm">
        {/* Panel header / toggle */}
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-black/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center shrink-0">
              <Settings2 className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-black leading-none">{collection.name}</p>
              <p className="text-xs text-black/40 mt-0.5">
                {collection.discountPercent != null && collection.discountPercent > 0
                  ? `${collection.discountPercent}% discount set`
                  : "No discount set"}
                {collection.isDefault && " · Default Collection"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {collection.discountPercent != null && collection.discountPercent > 0 && (
              <Badge className="bg-green-500 text-white text-[10px] font-bold rounded-full px-3">
                {collection.discountPercent}% OFF
              </Badge>
            )}
            {collection.isDefault && (
              <Badge className="bg-black text-white text-[10px] font-bold rounded-full px-3">
                Default
              </Badge>
            )}
            <ChevronDown
              className={`w-4 h-4 text-black/40 transition-transform duration-300 ${settingsOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {/* Expanded settings */}
        {settingsOpen && (
          <div className="border-t border-black/8 bg-white px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-black/50">
                  Collection Name
                </Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={collection.isDefault}
                  className="h-11 rounded-xl border-black/10 bg-black/[0.02]"
                  placeholder="Collection name"
                />
                {collection.isDefault && (
                  <p className="text-[11px] text-black/30">Default collection name cannot be changed</p>
                )}
              </div>

              {/* Discount */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-black/50">
                  Collection Discount (%)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(e.target.value)}
                    placeholder="e.g. 15"
                    className="h-11 rounded-xl border-black/10 bg-black/[0.02] pr-10"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 pointer-events-none" />
                </div>
                <p className="text-[11px] text-black/30">
                  Overrides individual product discounts when applied.
                </p>
              </div>

              {/* Description — full width */}
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-black/50">
                  Description
                </Label>
                <Textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Briefly describe this collection…"
                  rows={2}
                  className="rounded-xl border-black/10 bg-black/[0.02] resize-none"
                />
              </div>
            </div>

            {/* Settings actions */}
            <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-black/5">
              {/* Apply discount */}
              {collection.discountPercent != null && collection.discountPercent > 0 && (
                <Button
                  variant="outline"
                  onClick={handleApplyDiscount}
                  disabled={applyingDiscount}
                  className="h-10 px-5 rounded-xl border-green-200 text-green-700 hover:bg-green-50 text-xs font-bold"
                >
                  {applyingDiscount ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Apply {collection.discountPercent}% to All Products
                </Button>
              )}

              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditName(collection.name)
                    setEditDesc(collection.description ?? "")
                    setEditDiscount(collection.discountPercent != null ? String(collection.discountPercent) : "")
                    setSettingsOpen(false)
                  }}
                  className="h-10 px-4 rounded-xl border-black/10 text-xs font-bold"
                  disabled={savingSettings}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="h-10 px-6 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-widest hover:opacity-90"
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settings"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Product Picker Toolbar ─────────────────────────────────────────── */}
      <div className="sticky top-[80px] z-20 bg-white/95 backdrop-blur-md border border-black/8 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 pointer-events-none" />
            <Input
              placeholder="Search by name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex gap-1.5 flex-wrap">
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                  filterCategory === cat
                    ? "bg-black text-white border-black"
                    : "border-black/10 text-black/50 hover:border-black/30 hover:text-black"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>

          {/* Status chips */}
          <div className="flex gap-1.5">
            {(["all", "selected", "unselected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                  filterStatus === s
                    ? "bg-black text-white border-black"
                    : "border-black/10 text-black/50 hover:border-black/30 hover:text-black"
                }`}
              >
                {s === "all"
                  ? "All"
                  : s === "selected"
                  ? `In Collection (${selected.size})`
                  : "Not In Collection"}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom row: count + bulk select + save actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
          <div className="flex items-center gap-4">
            <span className="text-xs text-black/40 font-medium">
              Showing <span className="font-bold text-black">{filtered.length}</span> of {allProducts.length} products
            </span>
            <button
              onClick={allFilteredSelected ? deselectAll : selectAll}
              className="text-xs font-bold text-black/50 hover:text-black flex items-center gap-1.5 transition-colors"
            >
              {allFilteredSelected ? (
                <><CheckSquare className="w-3.5 h-3.5" /> Deselect shown</>
              ) : (
                <><Square className="w-3.5 h-3.5" /> Select all shown</>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-black/40">
              <span className="text-black">{selected.size}</span> selected
            </span>
            <Button
              onClick={() => router.push("/admin/collections")}
              variant="outline"
              className="h-9 px-4 rounded-xl border-black/10 text-xs font-bold"
              disabled={savingProducts}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back
            </Button>
            <Button
              onClick={handleSaveProducts}
              disabled={savingProducts || !dirtyProducts}
              className={`h-9 px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                dirtyProducts
                  ? "bg-black text-white hover:opacity-90 shadow-lg shadow-black/10"
                  : "bg-black/20 text-black/40 cursor-not-allowed"
              }`}
            >
              {savingProducts ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Return"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Product Grid ──────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 border border-dashed border-black/10 rounded-2xl text-black/30">
          <Package className="w-12 h-12" />
          <p className="text-sm font-bold uppercase tracking-widest">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((p) => {
            const isSelected = selected.has(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={`group relative flex flex-col rounded-2xl border-2 overflow-hidden text-left transition-all duration-200 ${
                  isSelected
                    ? "border-black shadow-lg shadow-black/10 scale-[1.01]"
                    : "border-black/8 hover:border-black/30 hover:shadow-md"
                }`}
              >
                {/* Image */}
                <div className="aspect-square bg-zinc-50 relative overflow-hidden">
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-black/15" />
                    </div>
                  )}

                  {/* Checkmark */}
                  <div
                    className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? "bg-black scale-100"
                        : "bg-white/80 border-2 border-black/20 scale-90 group-hover:scale-100"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>

                  {p.stock === 0 && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 py-1">
                      <p className="text-[9px] text-white/80 text-center font-bold uppercase tracking-wider">
                        Out of Stock
                      </p>
                    </div>
                  )}
                  {!p.isActive && (
                    <div className="absolute top-2 left-2">
                      <div className="bg-red-500/80 rounded-full w-2 h-2" title="Inactive" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5 bg-white flex-1">
                  <p className="text-xs font-bold text-black leading-tight line-clamp-2">{p.name}</p>
                  <p className="text-[10px] text-black/40 font-mono mt-1">{p.sku}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs font-bold text-black">
                      ₹{(p.discountedPrice ?? p.price).toLocaleString("en-IN")}
                    </p>
                    {p.category && (
                      <span className="text-[9px] text-black/30 uppercase tracking-wide truncate max-w-[60px]">
                        {p.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Floating save bar */}
      {dirtyProducts && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-4 bg-black text-white rounded-2xl px-6 py-3 shadow-2xl shadow-black/30">
            <span className="text-sm font-bold">{selected.size} products selected</span>
            <Button
              onClick={handleSaveProducts}
              disabled={savingProducts}
              className="h-9 px-6 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-white/90"
            >
              {savingProducts ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
