import { StorefrontLayout } from "@/components/storefront/storefront-layout"

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <StorefrontLayout>
      {children}
    </StorefrontLayout>
  )
}
