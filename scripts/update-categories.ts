import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import slugify from "slugify"

const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.category.findMany()
  console.log("Found", categories.length, "categories")
  
  for (const cat of categories) {
    let slug = slugify(cat.name, { lower: true })
    
    // Handle duplicates
    const existing = await prisma.category.findFirst({
      where: { slug, id: { not: cat.id } }
    })
    if (existing) {
      slug = `${slug}-${cat.id.slice(-4)}`
    }
    
    await prisma.category.update({
      where: { id: cat.id },
      data: { slug }
    })
    console.log(`Updated ${cat.name} -> ${slug}`)
  }
  console.log("Done!")
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => { console.error(err); prisma.$disconnect() })
