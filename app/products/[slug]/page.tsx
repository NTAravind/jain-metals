import { getProductBySlug } from "@/dal/products"
import { notFound } from "next/navigation"
import { ProductDetailClient } from "@/components/storefront/product-detail-client"
import type { Metadata } from "next"

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  return {
    title: product ? `${product.name} | Jain Metals` : "Not Found",
    description: product?.description,
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()
  return <ProductDetailClient product={product} />
}
