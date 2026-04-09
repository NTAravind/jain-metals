import { StorefrontLayout } from "@/components/storefront/storefront-layout"

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <StorefrontLayout>
      {children}
    </StorefrontLayout>
  )
}
