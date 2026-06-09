"use client"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Upload, X, Plus, Percent } from "lucide-react"
import { createProductAction, updateProductAction } from "@/actions/products"
import { toast } from "sonner"
import type { Product, Category } from "@/app/generated/prisma/client"
import Image from "next/image"


interface VariantRow {
  id?: string
  name: string
  price: string
  discountPercent: string
  stock: string
}

const emptyVariant = (): VariantRow => ({
  name: "",
  price: "",
  discountPercent: "0",
  stock: "0",
})

export function ProductForm({
  product,
  categories = []
}: {
  product?: (Product & { variants?: any[] }) | null
  categories?: Pick<Category, "id" | "name">[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // image URLs stored in DB / to be submitted
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  // track keys for images uploaded this session → enables immediate delete if removed
  // const sessionKeys = useRef<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)

  // ── Variants state ──
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants?.map((v: any) => ({
      id: v.id,
      name: v.name,
      price: String(v.price),
      discountPercent: String(v.discountPercent ?? 0),
      stock: String(v.stock ?? 0),
    })) ?? []
  )

  // ── Global discount ──
  const [globalDiscount, setGlobalDiscount] = useState("")

  const addVariant = () => setVariants((prev) => [...prev, emptyVariant()])

  const removeVariant = (idx: number) =>
    setVariants((prev) => prev.filter((_, i) => i !== idx))

  const updateVariant = (idx: number, field: keyof VariantRow, value: string) =>
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    )

  const applyGlobalDiscount = () => {
    const pct = parseFloat(globalDiscount)
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("Enter a valid discount between 0 and 100")
      return
    }
    setVariants((prev) =>
      prev.map((v) => ({ ...v, discountPercent: String(pct) }))
    )
    toast.success(`Applied ${pct}% discount to all variants`)
  }

  const calcDiscounted = (price: string, pct: string) => {
    const p = parseFloat(price)
    const d = parseFloat(pct)
    if (isNaN(p) || isNaN(d) || d <= 0) return null
    return Math.round(p * (1 - d / 100) * 100) / 100
  }

  // ── Upload (GitHub) ──────────────────────────────────────────────────────────

  const uploadToGitHub = async (file: File) => {
    setUploading(true)
    try {
      const extension = file.name.split('.').pop()
      const filename = `${Date.now()}-jain-product.${extension}`.toLowerCase()

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          content: base64,
          message: `Add product image: ${filename}`
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const { cdnUrl } = await res.json()
      setImages((prev) => [...prev, cdnUrl])
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = "" // reset input so same file can be re-picked

    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB")
      return
    }

    uploadToGitHub(file)
  }

  // ── Remove ──────────────────────────────────────────────────────────────────

  const handleRemoveImage = async (url: string) => {
    // remove from UI immediately
    setImages((prev) => prev.filter((u) => u !== url))
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (images.length === 0) {
      toast.error("At least one image is required")
      return
    }

    const formData = new FormData(e.currentTarget)
    // clear any auto-appended 'images' field, append each URL explicitly
    formData.delete("images")
    images.forEach((img) => formData.append("images", img))

    // Serialize variants as JSON
    const validVariants = variants
      .filter((v) => v.name.trim() && v.price)
      .map((v, i) => ({
        id: v.id,
        name: v.name.trim(),
        price: parseFloat(v.price),
        discountPercent: parseFloat(v.discountPercent) || 0,
        stock: parseInt(v.stock) || 0,
        sortOrder: i,
      }))
    formData.set("variants", JSON.stringify(validVariants))

    startTransition(async () => {
      let res
      if (product) {
        res = await updateProductAction(product.id, formData)
      } else {
        res = await createProductAction(formData)
      }

      if (res?.success) {
        toast.success(product ? "Product updated" : "Product created")
        router.push("/admin/products")
        router.refresh()
      } else {
        toast.error("Failed to save product")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Left side: Main Info ────────────────────────────────────────── */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-8">
          <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-xl shadow-black/[0.02] space-y-6 transition-all">
            <h2 className="text-xl font-bold text-black flex items-center gap-2 mb-6">
              <span className="w-1.5 h-6 bg-black rounded-full" />
              General Information
            </h2>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-black/40 ml-1">Product Name *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={product?.name} 
                  required 
                  className="rounded-xl h-12 border-black/10 bg-black/[0.02] focus:ring-black transition-all text-lg font-medium"
                  placeholder="e.g. Magnificent Brass Ganesha"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-black/40 ml-1">Composition & Narrative *</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={product?.description}
                  rows={6}
                  required
                  className="rounded-xl border-black/10 bg-black/[0.02] focus:ring-black transition-all resize-none text-base leading-relaxed"
                  placeholder="Describe the craftsmanship, materials, and significance..."
                />
              </div>

              <div className="space-y-2">
                  <Label htmlFor="categoryId" className="text-xs font-bold uppercase tracking-widest text-black/40 ml-1">Collection</Label>
                  <Select name="categoryId" defaultValue={product?.categoryId ?? "none"}>
                    <SelectTrigger className="rounded-xl h-12 border-black/10 bg-black/[0.02]">
                      <SelectValue placeholder="Select Collection" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-black/10">
                      <SelectItem value="none">General Archive</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>
          </div>

          {/* ── Variants Section ── */}
          <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-xl shadow-black/[0.02] space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-black flex items-center gap-2">
                <span className="w-1.5 h-6 bg-black rounded-full" />
                Dimensional Variants
              </h2>
              <Button type="button" variant="outline" size="sm" onClick={addVariant} className="rounded-xl border-black/10 hover:bg-black hover:text-white transition-all gap-2 px-4">
                <Plus className="w-4 h-4" /> Add Variant
              </Button>
            </div>
            
            <p className="text-sm text-black/40 font-medium -mt-4">
              Configure specific dimensions, weights, and unique pricing for different sizes.
            </p>

            {variants.length > 0 && (
              <div className="flex items-center gap-4 p-5 bg-black/5 rounded-2xl border border-black/5 backdrop-blur-sm">
                <div className="flex-1 max-w-[240px] space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-black/60 ml-1">Mass Discount %</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={globalDiscount}
                      onChange={(e) => setGlobalDiscount(e.target.value)}
                      placeholder="e.g. 15"
                      className="rounded-xl h-10 border-black/5 bg-white focus:ring-black pr-10"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                  </div>
                </div>
                <Button type="button" size="sm" onClick={applyGlobalDiscount} className="mt-5 rounded-xl bg-black text-white hover:opacity-80 transition-opacity h-10 px-6 font-bold text-xs uppercase tracking-widest shadow-md">
                  Apply to All
                </Button>
              </div>
            )}

            <div className="space-y-4 pt-4">
              {variants.map((v, idx) => {
                const discounted = calcDiscounted(v.price, v.discountPercent)
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center p-6 rounded-2xl border border-black/5 bg-black/[0.01] transition-all hover:bg-black/[0.02] group relative"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-black/30 truncate block">Size Label</Label>
                      <Input
                        value={v.name}
                        onChange={(e) => updateVariant(idx, "name", e.target.value)}
                        placeholder={'e.g. Large / 12"'}
                        className="h-10 rounded-xl border-black/5 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-black/30 truncate block">Price (₹)</Label>
                      <Input
                        type="number" step="0.01" min="0" value={v.price}
                        onChange={(e) => updateVariant(idx, "price", e.target.value)}
                        className="h-10 rounded-xl border-black/5 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-black/30 truncate block">Disc %</Label>
                      <Input
                        type="number" step="0.1" min="0" max="100" value={v.discountPercent}
                        onChange={(e) => updateVariant(idx, "discountPercent", e.target.value)}
                        className="h-10 rounded-xl border-black/5 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-black/30 truncate block">Final Price</Label>
                      <div className="h-10 flex items-center px-1 font-bold tabular-nums text-lg tracking-tight">
                        {discounted !== null ? (
                          <span className="text-black">₹{discounted.toLocaleString("en-IN")}</span>
                        ) : (
                          <span className="text-black/20">—</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-black/30 truncate block">Stock</Label>
                      <Input
                        type="number" min="0" value={v.stock}
                        onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                        className="h-10 rounded-xl border-black/5 bg-white"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                      onClick={() => removeVariant(idx)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                )
              })}
              {variants.length === 0 && (
                <div className="text-center py-12 px-6 border-2 border-dashed border-black/5 rounded-2xl bg-black/[0.01]">
                   <p className="text-sm text-black/40 font-medium italic">
                    No physical variants defined. Inventory will default to base parameters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right side: Sidebar Info ────────────────────────────────────── */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-8">
          
          {/* Status & Pricing Fallback */}
          <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-xl shadow-black/[0.02] space-y-6">
            <h2 className="text-xl font-bold text-black flex items-center gap-2 mb-2">
              <span className="w-1.5 h-6 bg-black rounded-full" />
              Storefront Parameters
            </h2>
            
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between p-4 bg-black/[0.02] rounded-2xl border border-black/5">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="text-sm font-bold text-black">Active Status</Label>
                  <p className="text-[10px] text-black/40 uppercase tracking-widest font-bold">Visibility in Store</p>
                </div>
                <Switch
                  id="isActive"
                  name="isActive"
                  value="true"
                  defaultChecked={product?.isActive ?? true}
                  className="data-[state=checked]:bg-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Base Price (₹)</Label>
                  <Input 
                    id="price" name="price" type="number" step="0.01" min="0" 
                    defaultValue={product?.price?.toString()} required 
                    className="rounded-xl h-11 border-black/10 bg-black/[0.02]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="discountedPrice" className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Disc. Price (₹)</Label>
                  <Input 
                    id="discountedPrice" name="discountedPrice" type="number" step="0.01" min="0" 
                    defaultValue={product?.discountedPrice?.toString() ?? ""} 
                    className="rounded-xl h-11 border-black/10 bg-black/[0.02]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stock" className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Legacy Inventory Count</Label>
                <Input 
                  id="stock" name="stock" type="number" min="0"
                  defaultValue={product?.stock?.toString() ?? "0"} required 
                  className="rounded-xl h-11 border-black/10 bg-black/[0.02]"
                />
              </div>
            </div>
          </div>

          {/* Media Assets */}
          <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-xl shadow-black/[0.02] space-y-6">
            <h2 className="text-xl font-bold text-black flex items-center gap-2 mb-2">
              <span className="w-1.5 h-6 bg-black rounded-full" />
              Visual Assets
            </h2>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {images.map((img, idx) => (
                  <div
                    key={img}
                    className="relative group w-24 h-24 rounded-2xl overflow-hidden border border-black/5 bg-black/[0.02] flex-shrink-0 shadow-sm transition-transform hover:scale-105"
                  >
                    <img src={img} alt={`Asset ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 text-[8px] font-bold px-2 py-0.5 rounded-full bg-black text-white uppercase tracking-tighter shadow-sm">
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img)}
                      className="absolute top-1 right-1 bg-black/40 hover:bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <label
                  className={`w-24 h-24 rounded-2xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center cursor-pointer hover:bg-black/[0.02] hover:border-black/20 transition-all flex-shrink-0 group ${
                    uploading ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-black/20" />
                  ) : (
                    <Upload className="w-5 h-5 text-black/20 group-hover:text-black/40 transition-colors" />
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="space-y-1.5 pt-4 border-t border-black/5">
                <Label htmlFor="videoUrl" className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Video Presentation (URL)</Label>
                <Input
                  id="videoUrl" name="videoUrl" type="url"
                  placeholder="https://vimeo.com/..."
                  defaultValue={product?.videoUrl ?? ""}
                  className="rounded-xl h-11 border-black/10 bg-black/[0.02] text-xs"
                />
              </div>
            </div>
          </div>
          
          {/* Tech Specs Summary */}
          <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-xl shadow-black/[0.02] space-y-6">
            <h2 className="text-xl font-bold text-black flex items-center gap-2 mb-2">
              <span className="w-1.5 h-6 bg-black rounded-full" />
              Technical Metrics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="weightKg" className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Weight (KG)</Label>
                <Input 
                  id="weightKg" name="weightKg" type="number" step="0.01" min="0" 
                  defaultValue={product?.weightKg?.toString() ?? ""} 
                  className="rounded-xl h-11 border-black/10 bg-black/[0.02]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="heightCm" className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Height (CM)</Label>
                <Input 
                  id="heightCm" name="heightCm" type="number" step="0.01" min="0" 
                  defaultValue={product?.heightCm?.toString() ?? ""} 
                  className="rounded-xl h-11 border-black/10 bg-black/[0.02]"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isPending || uploading}
              className="w-full h-14 rounded-2xl bg-black text-white font-bold text-base uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-black/10 group"
            >
              {isPending && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
              {product ? "Archive & Sync Changes" : "Forge New Entry"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/products")}
              disabled={isPending || uploading}
              className="w-full h-12 rounded-xl border-black/10 text-black/40 hover:text-black transition-all font-bold text-xs uppercase tracking-widest"
            >
              Discard Draft
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
