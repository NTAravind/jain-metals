"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth-guards"
import { createCategory, deleteCategory } from "@/dal/categories"
import { applyCategoryDiscount } from "@/dal/products"

const CategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
})

export async function createCategoryAction(formData: FormData) {
  await requireAdmin()

  const rawName = formData.get("name")
  
  const parsed = CategorySchema.safeParse({ name: rawName })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    const category = await createCategory(parsed.data.name)
    revalidatePath("/admin/categories")
    revalidatePath("/admin/products/new")
    revalidatePath("/products")
    revalidatePath("/")
    return { success: true, category }
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "A category with this name already exists" }
    }
    return { error: "Failed to create category" }
  }
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin()
  try {
    await deleteCategory(id)
    revalidatePath("/admin/categories")
    revalidatePath("/admin/products/new")
    revalidatePath("/products")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { error: "Failed to delete category (it may be in use)" }
  }
}

export async function applyCategoryDiscountAction(categoryId: string, discountPercent: number) {
  await requireAdmin()

  if (discountPercent < 0 || discountPercent > 100) {
    return { error: "Discount must be between 0 and 100" }
  }

  try {
    const result = await applyCategoryDiscount(categoryId, discountPercent)
    revalidatePath("/admin/categories")
    revalidatePath("/admin/products")
    revalidatePath("/products")
    revalidatePath("/")
    return { success: true, updated: result.updated }
  } catch (error) {
    return { error: "Failed to apply discount" }
  }
}

