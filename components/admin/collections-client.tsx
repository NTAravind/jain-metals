"use client"

import { useState, useTransition, useCallback } from "react"
import {
  createCollectionAction,
  updateCollectionAction,
  deleteCollectionAction,
  applyCollectionDiscountAction,
} from "@/actions/collections"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FolderOpen,
  Percent,
  Package,
  Zap,
  Layers,
  ArrowRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Collection = {
  id: string
  name: string
  slug: string
  description: string | null
  isDefault: boolean
  discountPercent: number | null
  _count: { products: number }
}

type CollectionProduct = {
  images: string[]
}

// ── Collection Form ───────────────────────────────────────────────────────────

function CollectionForm({
  collection,
  onSubmit,
}: {
  collection?: Collection | null
  onSubmit: (fd: FormData) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(new FormData(e.currentTarget))
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-black/50">
          Collection Name *
        </Label>
        <Input
          name="name"
          defaultValue={collection?.name ?? ""}
          required
          placeholder="e.g. Clearance, New Arrivals"
          className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black"
          disabled={collection?.isDefault}
        />
        {collection?.isDefault && (
          <p className="text-xs text-black/40">Default collection name cannot be changed</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-black/50">
          Description
        </Label>
        <Textarea
          name="description"
          defaultValue={collection?.description ?? ""}
          placeholder="Briefly describe this collection…"
          className="rounded-xl border-black/10 bg-black/[0.02] focus:ring-black resize-none"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-black/50">
          Collection Discount (%) — overrides product discount
        </Label>
        <div className="relative">
          <Input
            name="discountPercent"
            type="number"
            min="0"
            max="100"
            step="0.1"
            defaultValue={collection?.discountPercent ?? ""}
            placeholder="0 — no override"
            className="h-11 rounded-xl border-black/10 bg-black/[0.02] focus:ring-black pr-10"
          />
          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 pointer-events-none" />
        </div>
        <p className="text-xs text-black/40">
          When set, this % discount applies to all products in this collection and overrides their individual prices.
        </p>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl bg-black text-white font-bold uppercase tracking-widest text-sm hover:opacity-90"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : collection ? "Update Collection" : "Create Collection"}
      </Button>
    </form>
  )
}

// ── Collection Card ───────────────────────────────────────────────────────────

function CollectionCard({
  collection,
  collectionProducts,
  onEdit,
  onDelete,
}: {
  collection: Collection
  collectionProducts: CollectionProduct[]
  onEdit: (c: Collection) => void
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const [applyingDiscount, startApplyDiscount] = useTransition()

  const handleApplyDiscount = () => {
    startApplyDiscount(async () => {
      const res = await applyCollectionDiscountAction(collection.id)
      if (res.error) toast.error(res.error)
      else toast.success(`Discount applied to ${res.updated} products`)
      router.refresh()
    })
  }

  const previewImages = collectionProducts.slice(0, 4).map((p) => p.images[0]).filter(Boolean)

  return (
    <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      {/* Album mosaic preview */}
      <div className="relative aspect-[16/9] bg-zinc-50 overflow-hidden">
        {previewImages.length > 0 ? (
          <div
            className={`grid h-full gap-0.5 ${
              previewImages.length === 1
                ? "grid-cols-1"
                : previewImages.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 grid-rows-2"
            }`}
          >
            {previewImages.slice(0, 4).map((img, i) => (
              <div key={i} className="overflow-hidden bg-zinc-100">
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-black/20">
            <Layers className="w-12 h-12" />
            <span className="text-xs font-bold uppercase tracking-widest">No Products</span>
          </div>
        )}

        {/* Badges */}
        {collection.isDefault && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-full px-3">
              Default
            </Badge>
          </div>
        )}
        {collection.discountPercent != null && collection.discountPercent > 0 && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500 text-white text-[10px] font-bold rounded-full px-3">
              {collection.discountPercent}% OFF
            </Badge>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base text-black leading-tight">{collection.name}</h3>
            <span className="text-xs text-black/40 font-mono shrink-0 mt-0.5">
              {collection._count.products} items
            </span>
          </div>
          {collection.description && (
            <p className="text-xs text-black/50 leading-relaxed line-clamp-2">{collection.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {/* Navigate to dedicated products page */}
          <Link
            href={`/admin/collections/${collection.id}/products`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl border border-black/10 text-xs font-bold uppercase tracking-widest text-black/60 hover:bg-black hover:text-white hover:border-black transition-all"
          >
            <Package className="w-3.5 h-3.5" />
            Products
            <ArrowRight className="w-3 h-3 opacity-50" />
          </Link>

          {collection.discountPercent != null && collection.discountPercent > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleApplyDiscount}
              disabled={applyingDiscount}
              className="flex-1 h-9 rounded-xl border-green-200 text-green-700 hover:bg-green-50 text-xs font-bold"
            >
              {applyingDiscount ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <><Zap className="w-3.5 h-3.5 mr-1.5" />Apply</>
              )}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(collection)}
            className="h-9 w-9 p-0 rounded-xl border-black/10 hover:bg-black/5"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          {!collection.isDefault && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(collection.id)}
              className="h-9 w-9 p-0 rounded-xl border-red-100 hover:bg-red-50 text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Client Component ─────────────────────────────────────────────────────

export function CollectionsClient({
  collections,
  productsByCollection,
}: {
  collections: Collection[]
  productsByCollection: Record<string, CollectionProduct[]>
}) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleCreate = useCallback(async (fd: FormData) => {
    const res = await createCollectionAction(fd)
    if (res.error) toast.error(res.error)
    else {
      toast.success("Collection created")
      setDialogOpen(false)
      router.refresh()
    }
  }, [router])

  const handleUpdate = useCallback(async (fd: FormData) => {
    if (!editing) return
    const res = await updateCollectionAction(editing.id, fd)
    if (res.error) toast.error(res.error)
    else {
      toast.success("Collection updated")
      setDialogOpen(false)
      setEditing(null)
      router.refresh()
    }
  }, [editing, router])

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    const res = await deleteCollectionAction(deleteId)
    if (res.error) toast.error(res.error)
    else {
      toast.success("Collection deleted")
      setDeleteId(null)
      router.refresh()
    }
  }, [deleteId, router])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-black">Collections</h2>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">
            {collections.length} collection{collections.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => { setEditing(null); setDialogOpen(true) }}
          className="h-11 px-6 rounded-xl bg-black text-white font-bold uppercase tracking-widest text-xs hover:opacity-90 shadow-lg shadow-black/10"
        >
          <Plus className="w-4 h-4 mr-2" /> New Collection
        </Button>
      </div>

      {/* Album grid */}
      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border border-dashed border-black/10 rounded-2xl gap-4 text-black/30">
          <FolderOpen className="w-16 h-16" />
          <p className="text-sm font-bold uppercase tracking-widest">No collections yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              collectionProducts={productsByCollection[col.id] ?? []}
              onEdit={(c) => { setEditing(c); setDialogOpen(true) }}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); setEditing(null) } }}>
        <DialogContent className="max-w-lg rounded-3xl border-black/10 bg-white p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-bold text-black tracking-tight">
              {editing ? "Edit Collection" : "New Collection"}
            </DialogTitle>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mt-1">
              {editing ? "Update details and discount" : "Create a curated product grouping"}
            </p>
          </DialogHeader>
          <CollectionForm
            collection={editing}
            onSubmit={editing ? handleUpdate : handleCreate}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-black/10 bg-white p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-black">Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription className="text-black/60">
              This will permanently delete the collection. Products will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-xl border-black/10 hover:bg-black/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete Collection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
