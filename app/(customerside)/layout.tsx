import { StorefrontLayout } from "@/components/storefront/storefront-layout"

export default function CustomerSideLayout({ children }: { children: React.ReactNode }) {
  return (
    <StorefrontLayout>
      {children}
    </StorefrontLayout>
  )
}