/**
 * sync-all-images.ts
 *
 * Complete sync pass:
 *  A) For every DB product with no image → find its image by CSV number → upload + seed
 *  B) For every image file 097–158 that maps to a product NOT in the DB → create + upload + seed
 *
 * Run: npx tsx scripts/sync-all-images.ts
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

const CAT: Record<string, string> = {
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

// ── New products to CREATE (not yet in DB, have image files 097-158) ──────────
interface NewProduct {
  imgNo: number
  name: string
  categoryId: string
  price: number | null
  description: string
  weightKg?: number
}

const NEW_PRODUCTS: NewProduct[] = [
  { imgNo: 97,  name: "Brass Cow-Calf Large",        categoryId: CAT.cowCalf,     price: 5500,  description: "A beautifully detailed large brass cow and calf pair, symbolising abundance and maternal love.", weightKg: 1.100 },
  { imgNo: 101, name: "Brass Peacock Small",          categoryId: CAT.royalBrass,  price: 7000,  description: "An elegant small brass peacock sculpture, a symbol of grace and beauty for home decor.", weightKg: 1.300 },
  { imgNo: 102, name: "Brass Peacock Large",          categoryId: CAT.royalBrass,  price: 10000, description: "A stunning large brass peacock figurine, a majestic decorative piece for any space.", weightKg: 2.000 },
  { imgNo: 103, name: "Brass Sun Moon Wall Hanging",  categoryId: CAT.wallHanging, price: 4000,  description: "A decorative brass sun and moon wall hanging representing cosmic harmony.", weightKg: 0.700 },
  { imgNo: 107, name: "Brass Balaji Mini",            categoryId: CAT.balaji,      price: 2160,  description: "A finely crafted miniature brass Balaji idol, perfect for personal shrines and gifting.", weightKg: 0.120 },
  { imgNo: 110, name: "Brass Lakshmi Mini",           categoryId: CAT.lakshmi,     price: 1500,  description: "A petite brass Goddess Lakshmi idol, bringing prosperity and blessings to your home.", weightKg: 0.080 },
  { imgNo: 114, name: "Brass Shivling",               categoryId: CAT.royalBrass,  price: 1500,  description: "A sacred brass Shivling, a revered symbol of Lord Shiva's divine energy and cosmic power.", weightKg: 0.080 },
  { imgNo: 115, name: "Brass Vishnu Pada",            categoryId: CAT.royalBrass,  price: 900,   description: "Brass Vishnu Pada — the sacred footprint of Lord Vishnu, ideal for home puja.", weightKg: 0.050 },
  { imgNo: 116, name: "Brass Butter Krishna",         categoryId: CAT.krishna,     price: 3500,  description: "An adorable brass Bal Krishna (Butter Krishna) idol capturing the playful divine childhood.", weightKg: 0.190 },
  { imgNo: 119, name: "Brass Lakshmi Narasimha",      categoryId: CAT.lakshmi,     price: 4000,  description: "A powerful brass Lakshmi Narasimha idol, depicting the fierce yet protective form of Vishnu.", weightKg: 0.220 },
  { imgNo: 123, name: "Brass Hanging Lamp Large",     categoryId: CAT.lamp,        price: 3200,  description: "An ornate large brass hanging lamp that adds a warm, traditional glow to any space.", weightKg: 0.730 },
  { imgNo: 124, name: "Brass Hanging Lamp",           categoryId: CAT.lamp,        price: 2500,  description: "A beautiful brass hanging lamp, perfect for pooja rooms and traditional decor.", weightKg: 0.550 },
  { imgNo: 128, name: "Brass Ram Darbar Set",         categoryId: CAT.royalBrass,  price: 14500, description: "An exquisite brass Ram Darbar set featuring Lord Rama, Sita, Lakshmana and Hanuman.", weightKg: 2.900 },
  { imgNo: 130, name: "Brass Tortoise",               categoryId: CAT.royalBrass,  price: 7500,  description: "A solid brass tortoise figurine — an auspicious Vastu symbol of longevity and stability.", weightKg: 0.420 },
  { imgNo: 132, name: "Brass Peacock Decor",          categoryId: CAT.royalBrass,  price: 2880,  description: "A charming small brass peacock decorative piece, ideal for shelves and tabletops.", weightKg: 0.160 },
  { imgNo: 137, name: "Brass Lakshmi Balaji",         categoryId: CAT.royalBrass,  price: 2080,  description: "A compact brass Lakshmi Balaji idol set, a devotional piece for home temples.", weightKg: 0.130 },
  { imgNo: 138, name: "Brass Varahi Head",            categoryId: CAT.royalBrass,  price: 20000, description: "A majestic brass Varahi head sculpture, a rare and powerful depiction of the Shakti deity.", weightKg: 4.000 },
  { imgNo: 140, name: "Brass Ganesha Lakshmi Kalash", categoryId: CAT.ganesha,     price: 12000, description: "A premium brass Ganesha and Lakshmi Kalash set, perfect for festivals and gifting.", weightKg: 2.400 },
  { imgNo: 142, name: "Brass Radha",                  categoryId: CAT.krishna,     price: 7200,  description: "A graceful brass Radha idol, beautifully crafted to complement your Radha-Krishna pair.", weightKg: 0.400 },
  { imgNo: 143, name: "Brass Varahi",                 categoryId: CAT.royalBrass,  price: 78000, description: "A magnificent full brass Varahi deity idol, a rare collectible of exceptional craftsmanship.", weightKg: 15.600 },
  { imgNo: 146, name: "Brass Gowri",                  categoryId: CAT.royalBrass,  price: 9500,  description: "A divine brass Goddess Gowri (Parvati) idol, crafted for Gowri puja and home shrines.", weightKg: 1.900 },
  { imgNo: 150, name: "Brass Tribal Set",             categoryId: CAT.royalBrass,  price: 10000, description: "A unique brass tribal figurine set showcasing the rich cultural heritage of Indian tribal art.", weightKg: 2.150 },
  { imgNo: 152, name: "Brass Swastik Wall Hanging",   categoryId: CAT.wallHanging, price: 1300,  description: "A decorative brass Swastik wall hanging, an auspicious symbol of good luck and prosperity.", weightKg: 0.250 },
  { imgNo: 154, name: "Brass Krishna With Cow",       categoryId: CAT.krishna,     price: 11300, description: "A heartwarming brass Krishna with cow sculpture, symbolising the divine bond of the cowherd deity.", weightKg: 0.630 },
  { imgNo: 155, name: "Brass Dhoop Dhani",            categoryId: CAT.royalBrass,  price: 2500,  description: "A traditional brass dhoop dhani (incense burner) for daily puja and aromatic rituals.", weightKg: 0.500 },
  { imgNo: 156, name: "Peacock Lamp",                 categoryId: CAT.lamp,        price: 3000,  description: "An exquisitely designed peacock-shaped brass lamp with hanging chain, ideal for pooja rooms.", weightKg: 0.500 },
  { imgNo: 157, name: "Brass Shankh With Stand",      categoryId: CAT.royalBrass,  price: 16000, description: "A premium brass shankh (conch shell) with decorative stand — a sacred ritual object.", weightKg: 3.500 },
]

// DB products with no image → their CSV image number
const FIX_EXISTING: Record<string, number> = {
  "Brass Deity Figurine":  9,
  "Brass Sai Baba Small":  112,
  "Brass Sai Baba":        120,
  "Brass Ram Darbar Set":  128,
  "Brass Varahi Head":     138,
  "Brass Tribal Set":      150,
  "Brass Dhoop Dhani":     155,
  "Brass Shankh With Stand": 157,
}

// ── GitHub helpers ────────────────────────────────────────────────────────────
function githubRequest(method: string, urlPath: string, body?: object): Promise<{ statusCode: number; data: string }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined
    const req = https.request({
      hostname: "api.github.com", path: urlPath, method,
      headers: {
        "User-Agent": "jain-metals-uploader/1.0",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    }, (res) => {
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

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim()
}

function imgPath(n: number) {
  const file = `website ${String(n).padStart(3, "0")}.webp`
  return { local: path.join(IMAGES_DIR, file), repo: `${REPO_FOLDER}/website-${String(n).padStart(3, "0")}.webp` }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!GITHUB_TOKEN) { console.error("❌  GITHUB_TOKEN missing"); process.exit(1) }

  // ── Part A: Fix existing DB products with no image ────────────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("Part A: Seed images for existing products with no image")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  const noImgProducts = await prisma.product.findMany({
    where: { images: { equals: [] }, name: { not: "demo" } },
    select: { id: true, name: true },
  })

  let fixOk = 0, fixErr = 0
  for (const p of noImgProducts) {
    const imgNo = FIX_EXISTING[p.name]
    if (!imgNo) { console.log(`   ⚠️  No image mapping for "${p.name}" — skipping`); continue }
    const { local, repo } = imgPath(imgNo)
    process.stdout.write(`   [${String(imgNo).padStart(3, "0")}] ${p.name.padEnd(30)} `)
    try {
      if (!fs.existsSync(local)) throw new Error(`File not found: ${path.basename(local)}`)
      const cdnUrl = await uploadToGitHub(local, repo)
      await prisma.product.update({ where: { id: p.id }, data: { images: [cdnUrl] } })
      fixOk++; console.log(`✅  ${cdnUrl}`)
      await new Promise(r => setTimeout(r, 1500))
    } catch (e: unknown) { fixErr++; console.log(`❌  ${e instanceof Error ? e.message : e}`) }
  }

  // ── Part B: Create new products with images ───────────────────────────────
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`Part B: Create ${NEW_PRODUCTS.length} new products with images`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  // De-duplicate: skip products whose slug already exists (e.g., Ram Darbar was already created)
  const existingSlugs = new Set(
    (await prisma.product.findMany({ select: { slug: true } })).map(p => p.slug)
  )

  let newOk = 0, newSkip = 0, newErr = 0
  for (const p of NEW_PRODUCTS) {
    const slug = slugify(p.name)
    const { local, repo } = imgPath(p.imgNo)
    process.stdout.write(`   [${String(p.imgNo).padStart(3, "0")}] ${p.name.padEnd(30)} `)

    if (existingSlugs.has(slug)) {
      // Product already in DB but may need its image updated
      const dbP = await prisma.product.findUnique({ where: { slug }, select: { id: true, images: true } })
      if (dbP && dbP.images.length === 0) {
        try {
          if (!fs.existsSync(local)) throw new Error(`File not found: ${path.basename(local)}`)
          const cdnUrl = await uploadToGitHub(local, repo)
          await prisma.product.update({ where: { id: dbP.id }, data: { images: [cdnUrl] } })
          newOk++; console.log(`✅  (img updated) ${cdnUrl}`)
          await new Promise(r => setTimeout(r, 1500))
        } catch (e: unknown) { newErr++; console.log(`❌  ${e instanceof Error ? e.message : e}`) }
      } else {
        newSkip++; console.log(`⏭️  already exists with image`)
      }
      continue
    }

    try {
      if (!fs.existsSync(local)) throw new Error(`File not found: ${path.basename(local)}`)
      const cdnUrl = await uploadToGitHub(local, repo)

      const product = await prisma.product.create({
        data: {
          name: p.name, slug,
          description: p.description,
          categoryId: p.categoryId,
          price: p.price ?? 0,
          weightKg: p.weightKg,
          stock: 10,
          images: [cdnUrl],
          isActive: true,
        },
      })

      await prisma.productCollection.create({
        data: { productId: product.id, collectionId: DEFAULT_COLLECTION_ID },
      })

      existingSlugs.add(slug) // prevent double-create within this run
      newOk++; console.log(`✅  created → ${cdnUrl}`)
      await new Promise(r => setTimeout(r, 1500))
    } catch (e: unknown) { newErr++; console.log(`❌  ${e instanceof Error ? e.message : e}`) }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = await prisma.product.count({ where: { name: { not: "demo" } } })
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Part A (fix existing):  ✅ ${fixOk}  ❌ ${fixErr}
Part B (new products):  ✅ ${newOk}  ⏭️ ${newSkip}  ❌ ${newErr}
Total products in DB:   ${total}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

main()
  .catch(e => { console.error("Fatal:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
