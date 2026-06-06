/**
 * add-csv-missing.ts
 *
 * Creates the 7 remaining CSV products that are not yet in the DB.
 * Image numbers 112, 120, 128, 138, 150, 155, 157 — no webp files exist yet,
 * so products are created without images (admin can upload later).
 *
 * Run: npx tsx scripts/add-csv-missing.ts
 */

import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"

const prisma = new PrismaClient()

// ── Category IDs (from DB) ────────────────────────────────────────────────────
const CAT = {
  annapoorna:  "cmp04mxor0000rgj2sl82pexu",
  balaji:      "cmp04mxur0001rgj20b4jxx5y",
  buddha:      "cmp04mxw70002rgj2w98bayd4",
  cowCalf:     "cmp04mxxo0003rgj2gl4njwog",
  ganesha:     "cmp04mxyz0004rgj2e7ueti6z",
  krishna:     "cmp04my2l0005rgj26da35lze",
  lakshmi:     "cmp04my3t0006rgj2i8mcye4z",
  lamp:        "cmp04my4y0007rgj28ntv5f5i",
  natraj:      "cmp04my620008rgj2yf60ry68",
  parvati:     "cmp04my7j0009rgj2yel1xanh",
  raghavendra: "cmp04my8u000argj2uyh70t1k",
  royalBrass:  "cmp04mya4000brgj23jr2e4dw",
  saraswati:   "cmp04mybd000crgj2xqep16ds",
  tree:        "cmp04myd6000drgj2m4ba29ce",
  urli:        "cmp04myeg000ergj2qo8fmd76",
  vehicles:    "cmp04myh4000frgj2osof4ogt",
  wallHanging: "cmp04myjj000grgj2lni29bz2",
}

const DEFAULT_COLLECTION_ID = "cmpmg0f780000rg1c0mazfw77"

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim()
}

// ── Missing products (image 112-157 range, not in DB) ────────────────────────
const MISSING = [
  {
    name: "Brass Sai Baba Small",
    categoryId: CAT.royalBrass,
    price: 900,
    description: "A beautifully detailed small brass Sai Baba idol — an iconic symbol of devotion, unity and faith.",
    dims: '1.5"×1.5"×2"',
    weightKg: 0.050,
    varieties: "2 sizes",
  },
  {
    name: "Brass Sai Baba",
    categoryId: CAT.royalBrass,
    price: 1500,
    description: "A finely crafted brass Sai Baba idol, perfect for home temples and gifting on auspicious occasions.",
    dims: '1"×1"×3"',
    weightKg: 0.080,
    varieties: "NA",
  },
  {
    name: "Brass Ram Darbar Set",
    categoryId: CAT.royalBrass,
    price: 14500,
    description: "An exquisite brass Ram Darbar set featuring Lord Rama, Sita, Lakshmana and Hanuman — ideal for home shrines.",
    dims: '7"×3"×9"',
    weightKg: 2.900,
    varieties: "NA",
  },
  {
    name: "Brass Varahi Head",
    categoryId: CAT.royalBrass,
    price: 20000,
    description: "A majestic brass Varahi head sculpture, a rare and powerful depiction of the Shakti deity.",
    dims: '7"×11"×9.5"',
    weightKg: 4.000,
    varieties: "NA",
  },
  {
    name: "Brass Tribal Set",
    categoryId: CAT.royalBrass,
    price: 10000,
    description: "A unique brass tribal figurine set showcasing the rich cultural heritage of Indian tribal art.",
    dims: '1.75"×1.75"×7.25"',
    weightKg: 2.150,
    varieties: "NA",
  },
  {
    name: "Brass Dhoop Dhani",
    categoryId: CAT.royalBrass,
    price: 2500,
    description: "A traditional brass dhoop dhani (incense burner) crafted for daily puja and aromatic rituals.",
    dims: '2.25"×5.5"×2.5"',
    weightKg: 0.500,
    varieties: "NA",
  },
  {
    name: "Brass Shankh With Stand",
    categoryId: CAT.royalBrass,
    price: 16000,
    description: "A premium brass shankh (conch shell) with decorative stand — a sacred and auspicious ritual object.",
    dims: '5"×14"×9"',
    weightKg: 3.500,
    varieties: "NA",
  },
]

async function main() {
  console.log(`\n🚀  Adding ${MISSING.length} missing products to the DB\n`)
  let created = 0, skipped = 0, errors = 0

  for (const p of MISSING) {
    const slug = slugify(p.name)
    process.stdout.write(`   ${p.name.padEnd(32)} `)

    try {
      // Check if already exists
      const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } })
      if (existing) {
        skipped++
        console.log(`⏭️  already exists`)
        continue
      }

      const product = await prisma.product.create({
        data: {
          name: p.name,
          slug,
          description: p.description,
          categoryId: p.categoryId,
          price: p.price,
          weightKg: p.weightKg,
          stock: 10,
          images: [],   // no image file yet
          isActive: true,
        },
      })

      // Link to default collection
      await prisma.productCollection.create({
        data: {
          productId: product.id,
          collectionId: DEFAULT_COLLECTION_ID,
        },
      })

      created++
      console.log(`✅  created (id: ${product.id})`)
    } catch (err: unknown) {
      errors++
      console.log(`❌  ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Created  : ${created}
⏭️  Skipped  : ${skipped}
❌  Errors   : ${errors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝  Note: These products have no image yet because their image numbers (112–157)
    don't have corresponding webp files in HiCompress (only 001–096 exist).
    Upload images via the Admin panel once you have the files.
`)
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exit(1) })
  .finally(() => prisma.$disconnect())
