"use client"

import { useState, useCallback, useTransition } from "react"
import { deleteProductAction, toggleProductActiveAction } from "@/actions/products"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
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
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

type Product = {
  id: string
  name: string
  categoryName: string | null
  price: number
  stock: number
  isActive: boolean
}

type Category = {
  id: string
  name: string
}

export function ProductsClient({ 
  products, 
  pageCount, 
  currentPage, 
  totalCount,
  categories,
  activeCategory,
  activeStock,
}: { 
  products: Product[]
  pageCount?: number
  currentPage?: number
  totalCount?: number
  categories: Category[]
  activeCategory?: string
  activeStock?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleCategoryChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("category")
    } else {
      params.set("category", value)
    }
    params.delete("page")
    router.push(`/admin/products?${params.toString()}`)
  }, [router, searchParams])

  const handleStockChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("stock")
    } else {
      params.set("stock", value)
    }
    params.delete("page")
    router.push(`/admin/products?${params.toString()}`)
  }, [router, searchParams])

  const [, startToggle] = useTransition()
  // Track per-row optimistic active state: productId → boolean
  const [optimisticStates, setOptimisticStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(products.map((p) => [p.id, p.isActive]))
  )

  const handleToggleActive = (id: string, currentValue: boolean) => {
    const next = !currentValue
    setOptimisticStates((prev) => ({ ...prev, [id]: next }))
    startToggle(async () => {
      try {
        await toggleProductActiveAction(id, next)
        toast.success(next ? "Product set to Active" : "Product set to Inactive")
        router.refresh()
      } catch {
        // Revert optimistic update on failure
        setOptimisticStates((prev) => ({ ...prev, [id]: currentValue }))
        toast.error("Failed to update status")
      }
    })
  }

  const columns: Column<Product>[] = [
    { key: "name", header: "Name" },
    {
      key: "categoryName",
      header: "Category",
      cell: (row) => row.categoryName ?? "—",
    },
    {
      key: "price",
      header: "Price",
      cell: (row) => `₹${row.price}`,
    },
    {
      key: "stock",
      header: "Stock",
      cell: (row) => row.stock,
    },
    {
      key: "isActive",
      header: "Status",
      cell: (row) => {
        const active = optimisticStates[row.id] ?? row.isActive
        return (
          <div
            className="flex items-center gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Switch
              id={`toggle-${row.id}`}
              checked={active}
              onCheckedChange={() => handleToggleActive(row.id, active)}
              className="data-[state=checked]:bg-black"
            />
            <span
              className={`text-xs font-bold uppercase tracking-widest ${
                active ? "text-black" : "text-black/30"
              }`}
            >
              {active ? "Active" : "Inactive"}
            </span>
          </div>
        )
      },
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="icon"
            variant="ghost"
            asChild
          >
            <Link href={`/admin/products/${row.id}/edit`}>
              <Pencil className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDeleteId(row.id)}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]



  const handleDelete = async () => {
    if (!deleteId) return
    await deleteProductAction(deleteId)
    toast.success("Product deleted")
    setDeleteId(null)
    router.refresh()
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">Products</h1>
          <p className="text-black/50 mt-1 font-medium">Manage your product inventory and variants</p>
        </div>
        <Button asChild className="gap-2 bg-black text-white hover:opacity-90 transition-opacity rounded-xl h-12 px-6 shadow-lg">
          <Link href="/admin/products/new">
            <Plus className="w-5 h-5" /> Add Product
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-xl shadow-black/[0.02]">
        <DataTable
          columns={columns}
          data={products}
          searchable
          serverSide={true}
          pageCount={pageCount}
          currentPage={currentPage}
          totalCount={totalCount}
          searchPlaceholder="Search products..."
          emptyMessage="No products yet. Add your first one!"
          filterSlot={
            <div className="flex gap-2">
              <Select value={activeCategory ?? "all"} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px] h-10 rounded-xl border-black/10 bg-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={activeStock ?? "all"} onValueChange={handleStockChange}>
                <SelectTrigger className="w-[160px] h-10 rounded-xl border-black/10 bg-white">
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-white border-black/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-black">Delete this product?</AlertDialogTitle>
            <AlertDialogDescription className="text-black/60">
              This will permanently remove the product and all its variants.
              This action cannot be undone and will affect current orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-black/10 hover:bg-black/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">Delete Product</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
