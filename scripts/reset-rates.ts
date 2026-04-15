import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.deliveryPincode.updateMany({
    data: {
      basePrice: 0,
      pricePerKg: 0,
    },
  })
  console.log(`Updated ${result.count} pincodes.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
