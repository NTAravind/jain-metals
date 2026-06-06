/**
 * seed-by-image-number.ts
 *
 * The definitive approach: each CSV row = one product, identified by its IMAGE NUMBER.
 * 
 * Logic:
 * - For each CSV row (image 001-157), check if a DB product already has that CDN URL
 * - If YES → skip (already correct)
 * - If NO  → create a new product with the correct name/price/category + CDN URL
 *
 * This ensures exactly 157 products exist — one per image.
 *
 * Run: npx tsx scripts/seed-by-image-number.ts
 */

import "dotenv/config"
import * as fs from "fs"
import * as path from "path"
import { PrismaClient } from "../app/generated/prisma/client"

const prisma = new PrismaClient()

const GITHUB_OWNER = "jainmetalscontact-pixel"
const GITHUB_REPO  = "jain-metals"
const BRANCH       = "main"
const REPO_FOLDER  = "product-images"

const DEFAULT_COLLECTION_ID = "cmpmg0f780000rg1c0mazfw77"

const CAT: Record<string, string> = {
  "ROYAL BRASS":   "cmp04mya4000brgj23jr2e4dw",
  "ROYAL BRAS/":   "cmp04mya4000brgj23jr2e4dw",
  "BALAJI":        "cmp04mxur0001rgj20b4jxx5y",
  "BUDDHA":        "cmp04mxw70002rgj2w98bayd4",
  "COW AND CALF":  "cmp04mxxo0003rgj2gl4njwog",
  "COW-CALF":      "cmp04mxxo0003rgj2gl4njwog",
  "GANESHA":       "cmp04mxyz0004rgj2e7ueti6z",
  "KRISHNA":       "cmp04my2l0005rgj26da35lze",
  "RAM":           "cmp04my2l0005rgj26da35lze",
  "LAKSHMI":       "cmp04my3t0006rgj2i8mcye4z",
  "LAMP":          "cmp04my4y0007rgj28ntv5f5i",
  "NATRAJ":        "cmp04my620008rgj2yf60ry68",
  "PARVATI":       "cmp04my7j0009rgj2yel1xanh",
  "RAGHAVENDRA":   "cmp04my8u000argj2uyh70t1k",
  "SARASWATI":     "cmp04mybd000crgj2xqep16ds",
  "TREE":          "cmp04myd6000drgj2m4ba29ce",
  "URLI":          "cmp04myeg000ergj2qo8fmd76",
  "VEHICLES":      "cmp04myh4000frgj2osof4ogt",
  "WALL HANGING":  "cmp04myjj000grgj2lni29bz2",
  "ANNAPOORNA":    "cmp04mxor0000rgj2sl82pexu",
  "DECOR":         "cmp04mya4000brgj23jr2e4dw",
  "LALITHA DEVI":  "cmp04mya4000brgj23jr2e4dw",
  "HANUMAN":       "cmp04mya4000brgj23jr2e4dw",
  "VARAHI":        "cmp04mya4000brgj23jr2e4dw",
  "":              "cmp04mya4000brgj23jr2e4dw",
}

function getCat(c: string) { return CAT[c.toUpperCase().trim()] ?? "cmp04mya4000brgj23jr2e4dw" }

function slugify(name: string, imgNo: number): string {
  const base = name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim()
  return `${base}-img${imgNo}`
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/g, " ").trim()
}

function parseWeight(w: string): number | undefined {
  const kgM = w.match(/([\d.]+)\s*kilo/i)
  if (kgM) return parseFloat(kgM[1])
  const gM = w.match(/([\d.]+)\s*g/i)
  if (gM) return parseFloat(gM[1]) / 1000
  return undefined
}

function parseCsv(filePath: string) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)
  const header = lines[0].split(",").map(h => h.trim())
  const rows: Array<{img:number; name:string; category:string; price:number|null; weight:string; dims:string}> = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]; if (!line.trim()) continue
    const fields: string[] = []; let cur = "", inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === "," && !inQ) { fields.push(cur.trim()); cur = "" }
      else { cur += ch }
    }
    fields.push(cur.trim())
    const obj: Record<string, string> = {}
    header.forEach((h, idx) => (obj[h] = fields[idx] ?? ""))
    const imgStr = obj["image no."]?.trim()
    const name = obj["Name"]?.trim()
    if (!imgStr || !name) continue
    try {
      const n = parseInt(imgStr, 10)
      if (isNaN(n)) continue
      rows.push({
        img: n,
        name,
        category: obj["Category "]?.trim() ?? "",
        price: obj["Price"] ? parseFloat(obj["Price"]) || null : null,
        weight: obj["Weight "]?.trim() ?? "",
        dims: obj["Dimensions "]?.trim() ?? "",
      })
    } catch { /* skip */ }
  }
  return rows
}

async function main() {
  const csvFile = path.join(__dirname, "../Untitled spreadsheet - Sheet1.csv")
  const csvRows = parseCsv(csvFile)
  console.log(`📊  CSV rows: ${csvRows.length}`)

  // Build a set of all CDN URLs already in the DB
  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
    where: { name: { not: "demo" } },
  })
  console.log(`🗄️   Current DB products: ${allProducts.length}`)

  // Map cdnUrl → productId for quick lookup
  const urlToProduct = new Map<string, string>()
  for (const p of allProducts) {
    for (const url of p.images) urlToProduct.set(url, p.id)
  }

  let created = 0, alreadyExist = 0, errors = 0

  for (const row of csvRows) {
    const cdnUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/${REPO_FOLDER}/website-${String(row.img).padStart(3,"0")}.webp`

    process.stdout.write(`   [${String(row.img).padStart(3,"0")}] ${row.name.slice(0,38).padEnd(38)} `)

    if (urlToProduct.has(cdnUrl)) {
      alreadyExist++
      console.log(`⏭️  already seeded`)
      continue
    }

    // Create new product
    const cleanName = titleCase(row.name.replace(/\s+/g, " ").trim())
    const slug = slugify(cleanName, row.img)

    try {
      const product = await prisma.product.create({
        data: {
          name: cleanName,
          slug,
          description: `High-quality ${cleanName} crafted in brass.`,
          categoryId: getCat(row.category),
          price: row.price ?? 0,
          weightKg: parseWeight(row.weight),
          stock: 10,
          images: [cdnUrl],
          isActive: true,
        },
      })

      await prisma.productCollection.upsert({
        where: { productId_collectionId: { productId: product.id, collectionId: DEFAULT_COLLECTION_ID } },
        create: { productId: product.id, collectionId: DEFAULT_COLLECTION_ID },
        update: {},
      })

      created++
      console.log(`✅  created`)
    } catch (e: unknown) {
      errors++
      console.log(`❌  ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const total = await prisma.product.count({ where: { name: { not: "demo" } } })
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Created           : ${created}
⏭️  Already existed   : ${alreadyExist}
❌  Errors            : ${errors}
📦  Total in DB now   : ${total}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

main()
  .catch(e => { console.error("Fatal:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
