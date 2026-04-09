import { prisma } from "@/lib/db"
import { unstable_cache } from "next/cache"
import { cache } from "react"
import slugify from "slugify"

export const getAllCategories = unstable_cache(
  async () => {
    return await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } }
        }
      }
    })
  },
  ["categories_all"],
  { tags: ["categories"], revalidate: 86400 }
)

export const getCategoryById = cache(async (id: string) => {
  return await prisma.category.findUnique({
    where: { id },
  })
})

export async function createCategory(name: string) {
  const slug = slugify(name, { lower: true })
  return await prisma.category.create({
    data: { name, slug },
  })
}

export async function deleteCategory(id: string) {
  return await prisma.category.delete({
    where: { id },
  })
}
