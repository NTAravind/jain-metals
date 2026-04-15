"use client"

import { useState } from "react"
import { deleteProductAction } from "@/actions/products"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
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
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"

type Product = {
  id: string
  name: string
  categoryName: string | null
  style: string | null
  price: number
  stock: number
  isActive: boolean
}

export function ProductsClient({ 
  products, 
  pageCount, 
  currentPage, 
  totalCount 
}: { 
  products: Product[]
  pageCount?: number
  currentPage?: number
  totalCount?: number
}) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Product>[] = [
    { key: "name", header: "Name" },
    {
      key: "categoryName",
      header: "Category",
      cell: (row) => row.categoryName ?? "—",
    },
    { key: "style", header: "Style", cell: (row) => row.style ?? "—" },
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
      cell: (row) => (
        <Badge 
          variant={row.isActive ? "default" : "secondary"} 
          className={row.isActive 
            ? "bg-black text-white hover:opacity-90 rounded-full px-3 py-0.5" 
            : "bg-black/5 text-black/50 hover:bg-black/10 rounded-full px-3 py-0.5"}
        >
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
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
