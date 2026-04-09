"use client"

import { useState, useTransition } from "react"
import { createCategoryAction, deleteCategoryAction, applyCategoryDiscountAction } from "@/actions/categories"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Loader2, Percent } from "lucide-react"
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

type Category = {
  id: string
  name: string
}

export function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [name, setName] = useState("")
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Per-category discount state
  const [discountValues, setDiscountValues] = useState<Record<string, string>>({})
  const [applyingDiscount, setApplyingDiscount] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append("name", name.trim())

      const res = await createCategoryAction(formData)
      if (res.error) {
        toast.error(res.error)
      } else if (res.success && res.category) {
        toast.success("Category added")
        setCategories((prev) => [...prev, res.category as Category].sort((a,b) => a.name.localeCompare(b.name)))
        setName("")
      }
    })
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const id = deleteId
    setDeleteId(null)

    const res = await deleteCategoryAction(id)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Category deleted")
      setCategories((prev) => prev.filter((c) => c.id !== id))
    }
  }

  const handleApplyDiscount = async (categoryId: string) => {
    const pctStr = discountValues[categoryId]
    const pct = parseFloat(pctStr)
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("Enter a valid discount between 0 and 100")
      return
    }

    setApplyingDiscount(categoryId)
    const res = await applyCategoryDiscountAction(categoryId, pct)
    setApplyingDiscount(null)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`Applied ${pct}% discount to ${res.updated} products`)
      setDiscountValues((prev) => ({ ...prev, [categoryId]: "" }))
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end p-6 bg-black/[0.02] rounded-2xl border border-black/5">
        <div className="md:col-span-3 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ml-1">New Collection Designation</label>
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="e.g. Ritual Statues, Brass Ornaments..." 
            disabled={isPending}
            className="h-12 rounded-xl border-black/10 bg-white focus:ring-black transition-all text-base"
          />
        </div>
        <Button 
          type="submit" 
          disabled={isPending || !name.trim()}
          className="h-12 rounded-xl bg-black text-white font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Register
        </Button>
      </form>

      <div className="overflow-hidden">
        {categories.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-black/[0.03] rounded-full flex items-center justify-center mx-auto">
              <Plus className="w-6 h-6 text-black/20" />
            </div>
            <p className="text-black/40 font-medium italic">No collections registered in the archive.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 ml-1">Active Collections</h3>
            <div className="rounded-2xl border border-black/5 overflow-hidden bg-white">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/5 bg-black/[0.01]">
                    <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-black/40">Designation</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-black/40">Global Adjustment</th>
                    <th className="px-8 py-5 text-right font-bold uppercase tracking-widest text-[10px] text-black/40">Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-black/[0.01] transition-colors group">
                      <td className="px-8 py-6">
                        <span className="font-bold text-black text-base tracking-tight">{cat.name}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              placeholder="0"
                              className="h-10 w-24 pr-8 rounded-lg border-black/10 bg-black/[0.02] font-mono text-sm"
                              value={discountValues[cat.id] ?? ""}
                              onChange={(e) =>
                                setDiscountValues((prev) => ({ ...prev, [cat.id]: e.target.value }))
                              }
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-black/30">%</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-lg border-black/10 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                            disabled={applyingDiscount === cat.id || !discountValues[cat.id]}
                            onClick={() => handleApplyDiscount(cat.id)}
                          >
                            {applyingDiscount === cat.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Execute"
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-10 h-10 rounded-xl hover:bg-red-50 text-black/20 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                          onClick={() => setDeleteId(cat.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the category. Products assigned to this category will simply lose their category tag.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
