import { Navbar } from "@/components/storefront/navbar"
import { Footer } from "@/components/storefront/footer"
import { FloatingContact } from "@/components/storefront/floating-contact"
import { getAllCategories } from "@/dal/categories"
import { getNonDefaultCollections } from "@/dal/collections"

export async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [categories, collections] = await Promise.all([
    getAllCategories(),
    getNonDefaultCollections(),
  ])
  
  return (
    <div className="min-h-screen flex flex-col bg-white storefront selection:bg-brand-gold/20 selection:text-brand-navy">
      <Navbar categories={categories as any} collections={collections as any} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <Footer />
      <FloatingContact />
    </div>
  )
}

