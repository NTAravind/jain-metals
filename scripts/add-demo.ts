import { PrismaClient } from "../app/generated/prisma/client"

const prisma = new PrismaClient()

async function main() {
  const product = await prisma.product.create({
    data: {
      name: "Demo Product",
      slug: "demo-product-" + Date.now(),
      description: "A demo product for testing.",
      price: 1.0,
      stock: 100,
      isActive: true,
      variants: {
        create: [
          {
            name: "Variant 1",
            price: 1.0,
            stock: 50,
            sortOrder: 1,
          },
          {
            name: "Variant 2",
            price: 2.0,
            stock: 50,
            sortOrder: 2,
          }
        ]
      }
    }
  })

  console.log("Created product:", product)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
