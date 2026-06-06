/**
 * verify-and-fix.ts
 *
 * For EVERY CSV row (1-157), keyed by image URL:
 *  1. Find the DB product that has that image URL
 *  2. Verify & fix: price, name, weight, stock=10
 *  3. Report mismatches
 *
 * Run: npx tsx scripts/verify-and-fix.ts
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

function cdnUrl(imgNo: number) {
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/${REPO_FOLDER}/website-${String(imgNo).padStart(3, "0")}.webp`
}

function titleCase(s: string) {
  return s
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

function parseWeight(w: string): number | undefined {
  if (!w) return undefined
  const kgM = w.match(/([\d.]+)\s*kilo/i)
  if (kgM) return parseFloat(kgM[1])
  const gM = w.match(/([\d.]+)\s*g/i)
  if (gM) return parseFloat(gM[1]) / 1000
  return undefined
}

interface CsvRow {
  img: number; name: string; category: string
  price: number | null; weight: string; dims: string
}

function parseCsv(filePath: string): CsvRow[] {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)
  const header = lines[0].split(",").map(h => h.trim())
  const rows: CsvRow[] = []
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
      rows.push({
        img: parseInt(imgStr, 10),
        name, category: obj["Category "]?.trim() ?? "",
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
  console.log(`📊  CSV rows: ${csvRows.length}\n`)

  // Load all DB products, index by image URL
  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, price: true, stock: true, weightKg: true, images: true, description: true },
    where: { name: { not: "demo" } },
  })

  const urlToProduct = new Map<string, typeof allProducts[0]>()
  for (const p of allProducts) {
    for (const url of p.images) urlToProduct.set(url, p)
  }

  let ok = 0, fixed = 0, missing = 0, errors = 0

  for (const row of csvRows) {
    const url = cdnUrl(row.img)
    const dbP = urlToProduct.get(url)
    const csvName = titleCase(row.name)
    const csvPrice = row.price ?? 0
    const csvWeight = parseWeight(row.weight)

    process.stdout.write(`[${String(row.img).padStart(3, "0")}] ${csvName.slice(0, 35).padEnd(35)} `)

    if (!dbP) {
      missing++
      console.log(`❌ MISSING from DB`)
      continue
    }

    // Check what needs fixing
    const fixes: string[] = []
    const updateData: Record<string, unknown> = {}

    // Price
    if (csvPrice > 0 && Number(dbP.price) !== csvPrice) {
      fixes.push(`price: ₹${dbP.price}→₹${csvPrice}`)
      updateData.price = csvPrice
    }

    // Stock → always set to 10
    if (dbP.stock !== 10) {
      fixes.push(`stock: ${dbP.stock}→10`)
      updateData.stock = 10
    }

    // Weight
    if (csvWeight && csvWeight > 0 && dbP.weightKg !== csvWeight) {
      fixes.push(`weight: ${dbP.weightKg}→${csvWeight}`)
      updateData.weightKg = csvWeight
    }

    // Name: only fix if it looks like a generic auto-name (e.g. "Brass (117)")
    const dbName = dbP.name
    if (dbName !== csvName && (dbName.includes("(") || dbName === "Brass" || dbName.length < 8)) {
      fixes.push(`name: "${dbName}"→"${csvName}"`)
      updateData.name = csvName
    }

    // Description: fix if it's the generic placeholder
    if (dbP.description?.startsWith("High-quality") && csvName.length > 5) {
      const desc = `Beautifully handcrafted ${csvName}, made from premium quality brass. Perfect for home decor, puja rooms, and gifting.`
      updateData.description = desc
    }

    if (Object.keys(updateData).length > 0) {
      try {
        await prisma.product.update({ where: { id: dbP.id }, data: updateData })
        fixed++
        console.log(`🔧 fixed: ${fixes.join(", ")}`)
      } catch (e: unknown) {
        errors++
        console.log(`❌ ${e instanceof Error ? e.message : e}`)
      }
    } else {
      ok++
      console.log(`✅`)
    }
  }

  // Set stock=10 for ALL remaining products too (the ones with old URLs etc)
  const bulkUpdate = await prisma.product.updateMany({
    where: { name: { not: "demo" } },
    data: { stock: 10 },
  })
  console.log(`\n📦 Bulk set stock=10 for ${bulkUpdate.count} products`)

  const total = await prisma.product.count({ where: { name: { not: "demo" } } })
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Already correct  : ${ok}
🔧  Fixed            : ${fixed}
❌  Missing from DB  : ${missing}
❌  Errors           : ${errors}
📦  Total products   : ${total}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

main()
  .catch(e => { console.error("Fatal:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
