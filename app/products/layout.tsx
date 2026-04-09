import { StorefrontLayout } from "@/components/storefront/storefront-layout"

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <StorefrontLayout>
      {children}
    </StorefrontLayout>
  )
}
