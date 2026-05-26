import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Create default collection if it doesn't exist
  const existing = await prisma.collection.findFirst({ where: { isDefault: true } })
  if (!existing) {
    await prisma.collection.create({
      data: {
        name: "Default",
        slug: "default",
        description: "All products are part of this collection by default.",
        isDefault: true,
      },
    })
    console.log("✅ Default collection created")
  } else {
    console.log("ℹ️  Default collection already exists:", existing.name)
  }

  // Add all products to the default collection
  const defaultCollection = await prisma.collection.findFirst({ where: { isDefault: true } })
  if (!defaultCollection) return

  const products = await prisma.product.findMany({ select: { id: true } })
  let added = 0
  for (const product of products) {
    await prisma.productCollection.upsert({
      where: { productId_collectionId: { productId: product.id, collectionId: defaultCollection.id } },
      create: { productId: product.id, collectionId: defaultCollection.id },
      update: {},
    })
    added++
  }
  console.log(`✅ Linked ${added} products to the default collection`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
