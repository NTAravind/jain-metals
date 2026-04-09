import { getAllCategories } from "@/dal/categories"
import { CategoriesClient } from "./categories-client"

export const dynamic = "force-dynamic"

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">Curation Registry</h1>
        <p className="text-black/50 dark:text-white/50 mt-1 font-medium italic">Manage the thematic collections of Jain Metals</p>
      </div>
      
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/10 dark:border-white/10 p-8 shadow-xl shadow-black/[0.02] dark:shadow-white/[0.02]">
        <CategoriesClient initialCategories={categories} />
      </div>
    </div>
  )
}
