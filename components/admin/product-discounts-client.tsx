"use client"

import { useState, useTransition } from "react"
import {
  applyProductDiscountAction,
  clearProductDiscountAction,
  applyCategoryDiscountAction,
  clearCategoryDiscountAction,
} from "@/actions/product-discounts"
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
import {
  PercentCircle,
  Layers,
  Tag,
  Trash2,
  Loader2,
  TrendingDown,
  X,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = {
  id: string
  name: string
  price: number
  discountedPrice: number | null
  discountPercent: number
  stock: number
}

type Product = {
  id: string
  name: string
  sku: string
  price: number
  discountedPrice: number | null
  category: { id: string; name: string } | null
  variants: Variant[]
}

type Category = {
  id: string
  name: string
  _count?: { products: number }
}

const DISCOUNT_TYPES = [
  { value: "PERCENTAGE", label: "Percentage Off (%)", description: "e.g. 20% off the original price" },
  { value: "FIXED", label: "Fixed Amount Off (₹)", description: "e.g. ₹100 off the original price" },
  { value: "EXACT", label: "Exact Discounted Price (₹)", description: "Set the sale price directly" },
]

// ─── Discount Form ────────────────────────────────────────────────────────────

function DiscountForm({
  target,
  onSubmit,
  onCancel,
}: {
  target: { type: "product"; product: Product } | { type: "category"; category: Category }
  onSubmit: (type: string, value: number) => Promise<void>
  onCancel: () => void
}) {
  const [discountType, setDiscountType] = useState("PERCENTAGE")
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)

  const selectedType = DISCOUNT_TYPES.find((t) => t.value === discountType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid positive value")
      return
    }
    if (discountType === "PERCENTAGE" && num > 100) {
      toast.error("Percentage cannot exceed 100%")
      return
    }
    setLoading(true)
    await onSubmit(discountType, num)
    setLoading(false)
  }

  // Preview calculation
  const basePrice = target.type === "product" ? target.product.price : null
  const previewDiscounted = basePrice !== null && value
    ? discountType === "PERCENTAGE"
      ? basePrice * (1 - parseFloat(value) / 100)
      : discountType === "FIXED"
      ? Math.max(0, basePrice - parseFloat(value))
      : parseFloat(value)
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Target info */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-black/[0.03] border border-black/5">
        {target.type === "product" ? (
          <>
            <Tag className="w-4 h-4 mt-0.5 text-black/40 shrink-0" />
            <div>
              <p className="text-sm font-bold text-black">{target.product.name}</p>
              <p className="text-xs text-black/40 font-medium mt-0.5">
                Base price: ₹{target.product.price.toLocaleString("en-IN")}
                {target.product.discountedPrice && (
                  <span className="ml-2 text-amber-600">
                    · Currently ₹{target.product.discountedPrice.toLocaleString("en-IN")} discounted
                  </span>
                )}
              </p>
            </div>
          </>
        ) : (
          <>
            <Layers className="w-4 h-4 mt-0.5 text-black/40 shrink-0" />
            <div>
              <p className="text-sm font-bold text-black">{target.category.name}</p>
              <p className="text-xs text-black/40 font-medium mt-0.5">
                Category-wide discount — applies to all products
              </p>
            </div>
          </>
        )}
      </div>

      {/* Discount Type */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">
          Discount Type
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {DISCOUNT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setDiscountType(t.value)}
              className={cn(
                "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-200",
                discountType === t.value
                  ? "border-black bg-black text-white"
                  : "border-black/10 bg-black/[0.01] hover:border-black/20 text-black"
              )}
            >
              {t.value === "PERCENTAGE" && <PercentCircle className={cn("w-4 h-4", discountType === t.value ? "text-white" : "text-black/40")} />}
              {t.value === "FIXED" && <TrendingDown className={cn("w-4 h-4", discountType === t.value ? "text-white" : "text-black/40")} />}
              {t.value === "EXACT" && <Sparkles className={cn("w-4 h-4", discountType === t.value ? "text-white" : "text-black/40")} />}
              <span className={cn("text-xs font-bold leading-tight", discountType === t.value ? "text-white" : "text-black")}>
                {t.value === "PERCENTAGE" ? "Percentage" : t.value === "FIXED" ? "Fixed Off" : "Exact Price"}
              </span>
            </button>
          ))}
        </div>
        {selectedType && (
          <p className="text-xs text-black/40 font-medium ml-1 mt-1">{selectedType.description}</p>
        )}
      </div>

      {/* Value */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-black/50 ml-1">
          {discountType === "PERCENTAGE" ? "Discount Percentage (%)" : discountType === "FIXED" ? "Amount to Deduct (₹)" : "Sale Price (₹)"}
        </Label>
        <div className="relative">
          <Input
            type="number"
            step="0.01"
            min="0"
            max={discountType === "PERCENTAGE" ? "100" : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 150"}
            className="h-12 rounded-xl border-black/10 bg-black/[0.02] text-base font-bold focus:ring-black transition-all pr-16"
            required
            autoFocus
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-black/30 pointer-events-none">
            {discountType === "PERCENTAGE" ? "%" : "₹"}
          </span>
        </div>
      </div>

      {/* Price preview for single products */}
      {previewDiscounted !== null && !isNaN(previewDiscounted) && previewDiscounted > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-green-700 uppercase tracking-widest">Preview</p>
            <p className="text-sm text-green-600 font-medium">
              ₹{(basePrice ?? 0).toLocaleString("en-IN")} →{" "}
              <span className="font-bold text-lg text-green-700">
                ₹{Math.max(0, previewDiscounted).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
            </p>
          </div>
          <Badge className="bg-green-100 text-green-700 border-green-200 font-bold">
            {discountType === "PERCENTAGE" ? `${value}% off` : `₹${value} off`}
          </Badge>
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
          disabled={loading || !value}
          className="flex-1 h-12 rounded-xl bg-black text-white font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-lg shadow-black/10"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Apply Discount"}
        </Button>
      </div>
    </form>
  )
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab({
  products,
  categories,
  pageCount,
  currentPage,
  totalCount,
  activeCategoryFilter,
}: {
  products: Product[]
  categories: Category[]
  pageCount?: number
  currentPage?: number
  totalCount?: number
  activeCategoryFilter?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dialogProduct, setDialogProduct] = useState<Product | null>(null)
  const [clearTarget, setClearTarget] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Product",
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-bold text-black text-sm truncate">{r.name}</p>
          <p className="text-xs text-black/40 font-mono">{r.sku}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (r) => r.category ? (
        <Badge variant="outline" className="font-bold text-xs">{r.category.name}</Badge>
      ) : <span className="text-black/30">—</span>,
    },
    {
      key: "price",
      header: "Base Price",
      cell: (r) => <span className="font-mono font-bold">₹{r.price.toLocaleString("en-IN")}</span>,
    },
    {
      key: "discountedPrice",
      header: "Sale Price",
      cell: (r) => r.discountedPrice ? (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-green-600">₹{r.discountedPrice.toLocaleString("en-IN")}</span>
          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold">
            {Math.round(((r.price - r.discountedPrice) / r.price) * 100)}% off
          </Badge>
        </div>
      ) : (
        <span className="text-black/30 text-sm">No discount</span>
      ),
    },
    {
      key: "variants",
      header: "Variants",
      cell: (r) => r.variants.length > 0 ? (
        <span className="text-xs text-black/50 font-medium">{r.variants.length} variant{r.variants.length !== 1 ? "s" : ""}</span>
      ) : (
        <span className="text-black/30 text-xs">—</span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogProduct(r)}
            className="h-8 px-3 rounded-lg text-xs font-bold border-black/10 hover:bg-black hover:text-white transition-all"
          >
            <TrendingDown className="w-3.5 h-3.5 mr-1" />
            Set Discount
          </Button>
          {r.discountedPrice && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
              onClick={() => setClearTarget(r.id)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns.map((col) => ({
          ...col,
          header: (
            <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">
              {col.header as string}
            </span>
          ),
        }))}
        data={products}
        searchable
        serverSide
        pageCount={pageCount}
        currentPage={currentPage}
        totalCount={totalCount}
        searchPlaceholder="Search products..."
        emptyMessage="No products found."
        filterSlot={
          <Select
            value={activeCategoryFilter ?? "all"}
            onValueChange={(v) => {
              const params = new URLSearchParams(searchParams.toString())
              if (v === "all") params.delete("category")
              else params.set("category", v)
              params.delete("page")
              router.push(`/admin/discounts?${params.toString()}`)
            }}
          >
            <SelectTrigger className="w-[180px] h-10 rounded-xl border-black/10 bg-white text-sm font-medium">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Apply Discount Dialog */}
      <Dialog open={!!dialogProduct} onOpenChange={(v) => !v && setDialogProduct(null)}>
        <DialogContent className="max-w-lg rounded-3xl border-black/10 bg-white p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-bold text-black tracking-tight">Apply Product Discount</DialogTitle>
          </DialogHeader>
          {dialogProduct && (
            <DiscountForm
              target={{ type: "product", product: dialogProduct }}
              onSubmit={async (type, value) => {
                const fd = new FormData()
                fd.set("type", type)
                fd.set("value", String(value))
                const result = await applyProductDiscountAction(dialogProduct.id, fd)
                toast.success(`Discount applied to ${dialogProduct.name}`)
                setDialogProduct(null)
                router.refresh()
              }}
              onCancel={() => setDialogProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Clear Discount Confirmation */}
      <AlertDialog open={!!clearTarget} onOpenChange={(v) => !v && setClearTarget(null)}>
        <AlertDialogContent className="rounded-3xl border-black/10 bg-white p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-black">Remove Discount?</AlertDialogTitle>
            <AlertDialogDescription className="text-black/60">
              This will remove the discounted price from this product and all its variants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-xl border-black/10 hover:bg-black/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!clearTarget) return
                await clearProductDiscountAction(clearTarget)
                toast.success("Discount removed")
                setClearTarget(null)
                router.refresh()
              }}
            >
              Remove Discount
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [dialogCategory, setDialogCategory] = useState<Category | null>(null)
  const [clearTarget, setClearTarget] = useState<Category | null>(null)

  return (
    <>
      <div className="space-y-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-5 rounded-2xl border border-black/5 bg-white hover:border-black/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                <Layers className="w-5 h-5 text-black/40" />
              </div>
              <div>
                <p className="font-bold text-black">{category.name}</p>
                <p className="text-xs text-black/40 font-medium mt-0.5">
                  {category._count?.products ?? 0} product{(category._count?.products ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDialogCategory(category)}
                className="h-9 px-4 rounded-xl text-xs font-bold border-black/10 hover:bg-black hover:text-white transition-all"
              >
                <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
                Apply Discount
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setClearTarget(category)}
                className="h-9 px-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-16 text-black/30">
            <Layers className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No categories found</p>
          </div>
        )}
      </div>

      {/* Apply Category Discount Dialog */}
      <Dialog open={!!dialogCategory} onOpenChange={(v) => !v && setDialogCategory(null)}>
        <DialogContent className="max-w-lg rounded-3xl border-black/10 bg-white p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-bold text-black tracking-tight">Apply Category Discount</DialogTitle>
            <p className="text-xs font-bold uppercase tracking-widest text-black/40 mt-1">
              Applies to all products in this category
            </p>
          </DialogHeader>
          {dialogCategory && (
            <DiscountForm
              target={{ type: "category", category: dialogCategory }}
              onSubmit={async (type, value) => {
                const fd = new FormData()
                fd.set("type", type)
                fd.set("value", String(value))
                const result = await applyCategoryDiscountAction(dialogCategory.id, fd)
                toast.success(`Discount applied to ${(result as any).updated} products in ${dialogCategory.name}`)
                setDialogCategory(null)
                router.refresh()
              }}
              onCancel={() => setDialogCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Clear Category Discount Confirmation */}
      <AlertDialog open={!!clearTarget} onOpenChange={(v) => !v && setClearTarget(null)}>
        <AlertDialogContent className="rounded-3xl border-black/10 bg-white p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-black">
              Clear All Discounts in {clearTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black/60">
              This will remove discounts from all products and their variants in this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-xl border-black/10 hover:bg-black/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!clearTarget) return
                const result = await clearCategoryDiscountAction(clearTarget.id)
                toast.success(`Cleared discounts from ${(result as any).cleared} products`)
                setClearTarget(null)
                router.refresh()
              }}
            >
              Clear All Discounts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductDiscountsClient({
  products,
  categories,
  pageCount,
  currentPage,
  totalCount,
  activeTab = "products",
  activeCategoryFilter,
}: {
  products: Product[]
  categories: Category[]
  pageCount?: number
  currentPage?: number
  totalCount?: number
  activeTab?: string
  activeCategoryFilter?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const discountedCount = products.filter((p) => p.discountedPrice).length

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-black/[0.02] border border-black/5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-black/40">Total Products</p>
          <p className="text-2xl font-bold text-black">{totalCount ?? products.length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-green-50 border border-green-100 space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-green-600/60">On Sale</p>
          <p className="text-2xl font-bold text-green-700">{discountedCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-black/[0.02] border border-black/5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-black/40">Categories</p>
          <p className="text-2xl font-bold text-black">{categories.length}</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-black/10 pb-4">
        {[
          { id: "products", label: "By Product", icon: Tag },
          { id: "categories", label: "By Category", icon: Layers },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set("tab", id)
              params.delete("page")
              router.push(`/admin/discounts?${params.toString()}`)
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase tracking-widest text-xs transition-all",
              activeTab === id ? "bg-black text-white" : "text-black/50 hover:bg-black/5"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "categories" ? (
        <CategoriesTab categories={categories} />
      ) : (
        <ProductsTab
          products={products}
          categories={categories}
          pageCount={pageCount}
          currentPage={currentPage}
          totalCount={totalCount}
          activeCategoryFilter={activeCategoryFilter}
        />
      )}
    </div>
  )
}
