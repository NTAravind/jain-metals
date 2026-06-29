/**
 * seed-by-image-number.ts
 *
 * Patches CDN image URLs onto products already seeded by seed-admin.ts.
 * Matches products by the "Image #N" marker stored in their description.
 *
 * Run: npx tsx scripts/seed-by-image-number.ts
 */
import "dotenv/config"
import * as fs from "fs"
import * as path from "path"
import { PrismaClient } from "../app/generated/prisma/client"

const prisma = new PrismaClient()

const GITHUB_OWNER        = "jainmetalscontact-pixel"
const GITHUB_REPO         = "jain-metals"
const BRANCH              = "main"
const REPO_FOLDER         = "product-images"
const DEFAULT_COLLECTION_ID = "cmpmg0f780000rg1c0mazfw77"

function cdnUrl(imgNo: number): string {
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/${REPO_FOLDER}/website-${String(imgNo).padStart(3, "0")}.webp`
}

function parseCsv(filePath: string): Array<{ img: number; name: string; category: string; price: number | null; weight: string; dims: string }> {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)
  const header = lines[0].split(",").map(h => h.trim())
  const rows: Array<{ img: number; name: string; category: string; price: number | null; weight: string; dims: string }> = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const fields: string[] = []
    let cur = "", inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === "," && !inQ) { fields.push(cur.trim()); cur = "" }
      else { cur += ch }
    }
    fields.push(cur.trim())

    const obj: Record<string, string> = {}
    header.forEach((h, idx) => (obj[h] = fields[idx] ?? ""))

    const imgStr = obj["image no."]?.trim()
    const name   = obj["Name"]?.trim()
    if (!imgStr || !name) continue

    const n = parseInt(imgStr, 10)
    if (isNaN(n)) continue

    rows.push({
      img:      n,
      name,
      category: obj["Category "]?.trim() ?? "",
      price:    obj["Price"] ? parseFloat(obj["Price"]) || null : null,
      weight:   obj["Weight "]?.trim() ?? "",
      dims:     obj["Dimensions "]?.trim() ?? "",
    })
  }
  return rows
}

async function main() {
  const csvFile = path.join(__dirname, "../Untitled spreadsheet - Sheet1.csv")
  const csvRows = parseCsv(csvFile)
  console.log(`📊  CSV rows: ${csvRows.length}`)

  // Build imageNo → product map by parsing "Image #N" from description
  const allProducts = await prisma.product.findMany({
    select: { id: true, description: true, images: true },
  })
  console.log(`🗄️   DB products: ${allProducts.length}`)

  const imageNoToProduct = new Map<number, { id: string; images: string[] }>()
  for (const p of allProducts) {
    const match = p.description?.match(/Image #(\d+)/)
    if (match) {
      imageNoToProduct.set(parseInt(match[1], 10), { id: p.id, images: p.images })
    }
  }
  console.log(`🗺️   Matched ${imageNoToProduct.size} products via Image # marker\n`)

  let patched = 0, alreadyDone = 0, notFound = 0, errors = 0

  for (const row of csvRows) {
    const url    = cdnUrl(row.img)
    const label  = `[${String(row.img).padStart(3, "0")}] ${row.name.slice(0, 38).padEnd(38)}`
    process.stdout.write(`   ${label} `)

    const product = imageNoToProduct.get(row.img)

    if (!product) {
      notFound++
      console.log(`⚠️  not found in DB (run seed-admin first)`)
      continue
    }

    if (product.images.includes(url)) {
      alreadyDone++
      console.log(`⏭️  already has image`)
      continue
    }

    try {
      // Prepend the CDN url (keep any existing images, deduplicated)
      const newImages = [url, ...product.images.filter(u => u !== url)]
      await prisma.product.update({
        where: { id: product.id },
        data:  { images: newImages },
      })

      // Ensure collection membership
      await prisma.productCollection.upsert({
        where:  { productId_collectionId: { productId: product.id, collectionId: DEFAULT_COLLECTION_ID } },
        create: { productId: product.id, collectionId: DEFAULT_COLLECTION_ID },
        update: {},
      })

      patched++
      console.log(`✅  patched`)
    } catch (e: unknown) {
      errors++
      console.log(`❌  ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const total = await prisma.product.count()
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Patched           : ${patched}
⏭️  Already had image : ${alreadyDone}
⚠️  Not found in DB   : ${notFound}
❌  Errors            : ${errors}
📦  Total in DB       : ${total}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

main()
  .catch(e => { console.error("Fatal:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())