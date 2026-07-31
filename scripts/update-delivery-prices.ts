import { config } from 'dotenv'
config()
import { PrismaClient } from '../app/generated/prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.stateDelivery.updateMany({
    data: {
      basePrice: 100,
      pricePerKg: 0,
      freeAboveValue: 2000,
    }
  })

  await prisma.deliveryPincode.updateMany({
    data: {
      basePrice: 100,
      pricePerKg: 0,
      freeAboveValue: 2000,
    }
  })

  console.log('Successfully updated delivery prices to 100 and free above 2000.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
