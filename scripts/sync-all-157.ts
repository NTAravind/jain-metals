/**
 * sync-all-157.ts
 *
 * Full sync for ALL 157 CSV products:
 *  - Uploads every image (website 001-157 + 158 if present) to GitHub
 *  - If product already in DB → updates its images[] with CDN URL
 *  - If product NOT in DB → creates it with the CDN URL
 *
 * Run: npx tsx scripts/sync-all-157.ts
 */

import "dotenv/config"
import * as fs from "fs"
import * as path from "path"
import * as https from "https"
import { PrismaClient } from "../app/generated/prisma/client"

const prisma = new PrismaClient()

const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.trim()!
const GITHUB_OWNER = "jainmetalscontact-pixel"
const GITHUB_REPO  = "jain-metals"
const IMAGES_DIR   = path.join(__dirname, "../HiCompress")
const BRANCH       = "main"
const REPO_FOLDER  = "product-images"
const DEFAULT_COLLECTION_ID = "cmpmg0f780000rg1c0mazfw77"

// ── Category IDs ──────────────────────────────────────────────────────────────
const CAT: Record<string, string> = {
  "ROYAL BRASS":        "cmp04mya4000brgj23jr2e4dw",
  "BALAJI":             "cmp04mxur0001rgj20b4jxx5y",
  "BUDDHA":             "cmp04mxw70002rgj2w98bayd4",
  "COW AND CALF":       "cmp04mxxo0003rgj2gl4njwog",
  "COW-CALF":           "cmp04mxxo0003rgj2gl4njwog",
  "GANESHA":            "cmp04mxyz0004rgj2e7ueti6z",
  "KRISHNA":            "cmp04my2l0005rgj26da35lze",
  "RAM":                "cmp04my2l0005rgj26da35lze",
  "LAKSHMI":            "cmp04my3t0006rgj2i8mcye4z",
  "LAMP":               "cmp04my4y0007rgj28ntv5f5i",
  "NATRAJ":             "cmp04my620008rgj2yf60ry68",
  "PARVATI":            "cmp04my7j0009rgj2yel1xanh",
  "RAGHAVENDRA":        "cmp04my8u000argj2uyh70t1k",
  "SARASWATI":          "cmp04mybd000crgj2xqep16ds",
  "TREE":               "cmp04myd6000drgj2m4ba29ce",
  "URLI":               "cmp04myeg000ergj2qo8fmd76",
  "VEHICLES":           "cmp04myh4000frgj2osof4ogt",
  "WALL HANGING":       "cmp04myjj000grgj2lni29bz2",
  "ANNAPOORNA":         "cmp04mxor0000rgj2sl82pexu",
  "DECOR":              "cmp04mya4000brgj23jr2e4dw",
  "LALITHA DEVI":       "cmp04mya4000brgj23jr2e4dw",
  "HANUMAN":            "cmp04mya4000brgj23jr2e4dw",
  "VARAHI":             "cmp04mya4000brgj23jr2e4dw",
}

function getCategoryId(csvCategory: string): string {
  return CAT[csvCategory.toUpperCase().trim()] ?? "cmp04mya4000brgj23jr2e4dw" // default: royalBrass
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim()
}

function normalize(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/g, " ").trim()
}

function similarity(a: string, b: string): number {
  const sa = new Set(normalize(a).split(" ").filter(Boolean))
  const sb = new Set(normalize(b).split(" ").filter(Boolean))
  let common = 0; for (const t of sa) if (sb.has(t)) common++
  return common / Math.max(sa.size, sb.size)
}

function parseWeight(w: string): number | undefined {
  if (!w) return undefined
  const kgM = w.match(/([\d.]+)\s*kilo/i)
  if (kgM) return parseFloat(kgM[1])
  const gM = w.match(/([\d.]+)\s*g/i)
  if (gM) return parseFloat(gM[1]) / 1000
  return undefined
}

// ── GitHub helpers ────────────────────────────────────────────────────────────
function githubRequest(method: string, urlPath: string, body?: object): Promise<{ statusCode: number; data: string }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined
    const req = https.request({
      hostname: "api.github.com", path: urlPath, method,
      headers: {
        "User-Agent": "jain-metals-sync/1.0",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    }, res => {
      let data = ""
      res.on("data", (c: Buffer) => (data += c.toString()))
      res.on("end", () => resolve({ statusCode: res.statusCode ?? 0, data }))
    })
    req.on("error", reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function getFileSha(repoPath: string): Promise<string | null> {
  const enc = repoPath.split("/").map(encodeURIComponent).join("/")
  const { statusCode, data } = await githubRequest("GET", `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${enc}?ref=${BRANCH}`)
  if (statusCode === 200) { try { return (JSON.parse(data) as { sha: string }).sha } catch { return null } }
  return null
}

async function uploadToGitHub(localPath: string, repoPath: string): Promise<string> {
  const enc = repoPath.split("/").map(encodeURIComponent).join("/")
  const base64Content = fs.readFileSync(localPath).toString("base64")
  const existingSha = await getFileSha(repoPath)
  const body: Record<string, unknown> = {
    message: `chore: ${existingSha ? "update" : "add"} ${path.basename(repoPath)}`,
    content: base64Content, branch: BRANCH,
  }
  if (existingSha) body.sha = existingSha
  const { statusCode, data } = await githubRequest("PUT", `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${enc}`, body)
  if (statusCode !== 200 && statusCode !== 201) {
    let msg = data; try { msg = (JSON.parse(data) as { message: string }).message } catch {}
    throw new Error(`GitHub [${statusCode}]: ${msg}`)
  }
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/${repoPath}`
}

// ── Parse CSV ─────────────────────────────────────────────────────────────────
interface CsvRow { img: number; name: string; category: string; price: number | null; weight: string; dims: string; varieties: string }

function parseCsv(filePath: string): CsvRow[] {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)
  const header = lines[0].split(",").map(h => h.trim())
  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parse (handles quoted fields)
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
    header.forEach((h, i) => (obj[h] = fields[i] ?? ""))
    const imgStr = obj["image no."]?.trim()
    const name   = obj["Name"]?.trim()
    if (!imgStr || !name) continue
    try {
      rows.push({
        img: parseInt(imgStr, 10),
        name,
        category: obj["Category "]?.trim() ?? "",
        price: obj["Price"] ? parseFloat(obj["Price"]) || null : null,
        weight: obj["Weight "]?.trim() ?? "",
        dims: obj["Dimensions "]?.trim() ?? "",
        varieties: obj["Variety/Sizes "]?.trim() ?? "",
      })
    } catch { /* skip */ }
  }
  return rows
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!GITHUB_TOKEN) { console.error("❌  GITHUB_TOKEN missing"); process.exit(1) }

  // 1. Parse CSV
  const csvFile = path.join(__dirname, "../Untitled spreadsheet - Sheet1.csv")
  const csvRows = parseCsv(csvFile)
  console.log(`📊  CSV rows loaded: ${csvRows.length}`)

  // 2. Get available image files
  const availableImgs = new Set(
    fs.readdirSync(IMAGES_DIR)
      .filter(f => f.endsWith(".webp"))
      .map(f => { const m = f.match(/(\d+)\.webp$/); return m ? parseInt(m[1], 10) : null })
      .filter((n): n is number => n !== null)
  )
  console.log(`🖼️   Image files available: ${availableImgs.size}`)

  // 3. Load all DB products
  const dbProducts = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, images: true },
    where: { name: { not: "demo" } },
  })
  console.log(`🗄️   DB products: ${dbProducts.length}`)

  // 4. Build slug set for fast lookup
  const dbSlugMap = new Map(dbProducts.map(p => [p.slug, p]))
  const dbNameMap = new Map(dbProducts.map(p => [p.name.toUpperCase(), p]))

  // 5. Process each CSV row that has an image file
  console.log("\n🚀  Processing all products with images...\n")

  let uploaded = 0, created = 0, updated = 0, skipped = 0, errors = 0

  // Deduplicate name+price combos to avoid creating true duplicates
  const usedSlugs = new Set(dbProducts.map(p => p.slug))

  for (const row of csvRows) {
    if (!availableImgs.has(row.img)) {
      console.log(`   [${String(row.img).padStart(3,"0")}] ${row.name.slice(0,35).padEnd(35)} ⏭️  no image file`)
      skipped++
      continue
    }

    const localFile = path.join(IMAGES_DIR, `website ${String(row.img).padStart(3, "0")}.webp`)
    const repoPath  = `${REPO_FOLDER}/website-${String(row.img).padStart(3, "0")}.webp`
    const csvNormName = titleCase(row.name.replace(/\s+/g, " ").trim())
    const slug = slugify(csvNormName)

    process.stdout.write(`   [${String(row.img).padStart(3,"0")}] ${csvNormName.slice(0,35).padEnd(35)} `)

    try {
      // Upload image
      const cdnUrl = await uploadToGitHub(localFile, repoPath)
      uploaded++

      // Find existing DB product by slug or fuzzy name match
      let dbProduct = dbSlugMap.get(slug) ?? dbNameMap.get(csvNormName.toUpperCase())

      if (!dbProduct) {
        // Try fuzzy match (score >= 0.6)
        let best: typeof dbProducts[0] | null = null, bestScore = 0
        for (const p of dbProducts) {
          const s = similarity(row.name, p.name)
          if (s > bestScore) { bestScore = s; best = p }
        }
        if (best && bestScore >= 0.6) dbProduct = best
      }

      if (dbProduct) {
        // Update existing product's image (always — ensures CDN URL is fresh)
        await prisma.product.update({ where: { id: dbProduct.id }, data: { images: [cdnUrl] } })
        updated++
        console.log(`✅  updated  → ${cdnUrl}`)
      } else {
        // Create new product
        if (usedSlugs.has(slug)) {
          // Append img number to make slug unique
          const uniqueSlug = `${slug}-${row.img}`
          const product = await prisma.product.create({
            data: {
              name: `${csvNormName} (${row.img})`,
              slug: uniqueSlug,
              description: `High-quality ${csvNormName} crafted in brass.`,
              categoryId: getCategoryId(row.category),
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
          usedSlugs.add(uniqueSlug)
          created++
          console.log(`✅  created  → ${cdnUrl}`)
        } else {
          const product = await prisma.product.create({
            data: {
              name: csvNormName,
              slug,
              description: `High-quality ${csvNormName} crafted in brass.`,
              categoryId: getCategoryId(row.category),
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
          usedSlugs.add(slug)
          created++
          console.log(`✅  created  → ${cdnUrl}`)
        }
      }

      await new Promise(r => setTimeout(r, 1500))
    } catch (e: unknown) {
      errors++
      console.log(`❌  ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const total = await prisma.product.count({ where: { name: { not: "demo" } } })
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤  Uploaded to GitHub : ${uploaded}
✏️  DB updated          : ${updated}
➕  DB created          : ${created}
⏭️  Skipped (no file)  : ${skipped}
❌  Errors              : ${errors}
📦  Total products now  : ${total}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

main()
  .catch(e => { console.error("Fatal:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
