/**
 * add-missing-products.ts
 *
 * Adds the 8 products that were unmatched in the first upload run,
 * plus fixes "Brass Deity Figurine" which has no image.
 * For each product:
 *   1. Uploads the .webp to GitHub → gets CDN URL
 *   2. Creates (or updates) the product in the DB with the image
 *
 * Run:  npx tsx scripts/add-missing-products.ts
 */

import "dotenv/config"
import * as fs from "fs"
import * as path from "path"
import * as https from "https"
import { PrismaClient } from "../app/generated/prisma/client"

const prisma = new PrismaClient()

// ── Config ────────────────────────────────────────────────────────────────────
const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.trim()!
const GITHUB_OWNER = "jainmetalscontact-pixel"
const GITHUB_REPO  = "jain-metals"
const IMAGES_DIR   = path.join(__dirname, "../HiCompress")
const BRANCH       = "main"
const REPO_FOLDER  = "product-images"

// ── Category IDs (from DB) ────────────────────────────────────────────────────
const CATEGORY = {
  annapoorna:   "cmp04mxor0000rgj2sl82pexu",
  balaji:       "cmp04mxur0001rgj20b4jxx5y",
  buddha:       "cmp04mxw70002rgj2w98bayd4",
  cowCalf:      "cmp04mxxo0003rgj2gl4njwog",
  ganesha:      "cmp04mxyz0004rgj2e7ueti6z",
  krishna:      "cmp04my2l0005rgj26da35lze",
  lakshmi:      "cmp04my3t0006rgj2i8mcye4z",
  lamp:         "cmp04my4y0007rgj28ntv5f5i",
  natraj:       "cmp04my620008rgj2yf60ry68",
  parvati:      "cmp04my7j0009rgj2yel1xanh",
  raghavendra:  "cmp04my8u000argj2uyh70t1k",
  royalBrass:   "cmp04mya4000brgj23jr2e4dw",
  saraswati:    "cmp04mybd000crgj2xqep16ds",
  tree:         "cmp04myd6000drgj2m4ba29ce",
  urli:         "cmp04myeg000ergj2qo8fmd76",
  vehicles:     "cmp04myh4000frgj2osof4ogt",
  wallHanging:  "cmp04myjj000grgj2lni29bz2",
}

const DEFAULT_COLLECTION_ID = "cmpmg0f780000rg1c0mazfw77"

// ── Products to add ───────────────────────────────────────────────────────────
// Each entry: imgNo (matches "website NNN.webp"), name, categoryId, price
const MISSING_PRODUCTS: Array<{
  imgNo: number
  name: string
  categoryId: string
  price: number
  description?: string
}> = [
  {
    imgNo: 47,
    name: "Brass Lalitha Devi",
    categoryId: CATEGORY.royalBrass,
    price: 25000,
    description: "A beautifully crafted brass Lalitha Devi idol, radiating divine grace and artisanal excellence.",
  },
  {
    imgNo: 71,
    name: "Brass Vishnu",
    categoryId: CATEGORY.royalBrass,
    price: 3240,
    description: "An exquisite brass Vishnu idol, crafted with fine detail to bring peace and prosperity to your home.",
  },
  {
    imgNo: 80,
    name: "Brass Shankh",
    categoryId: CATEGORY.royalBrass,
    price: 2700,
    description: "A finely crafted brass shankh (conch shell), a sacred symbol used in Hindu rituals and worship.",
  },
  {
    imgNo: 81,
    name: "Brass Ganesha Antique",
    categoryId: CATEGORY.ganesha,
    price: 18000,
    description: "A premium antique-finish brass Ganesha idol, the remover of obstacles, perfect for home and office puja.",
  },
  {
    imgNo: 88,
    name: "Brass Om Ganesha Hanging",
    categoryId: CATEGORY.wallHanging,
    price: 6750,
    description: "An elegant brass Om Ganesha wall hanging, combining divine symbolism with decorative beauty.",
  },
  {
    imgNo: 89,
    name: "Brass Kalash Wall Hanging",
    categoryId: CATEGORY.wallHanging,
    price: 7500,
    description: "A decorative brass Kalash wall hanging symbolising abundance and auspiciousness.",
  },
  {
    imgNo: 92,
    name: "Brass Raghavendra Swami",
    categoryId: CATEGORY.raghavendra,
    price: 1000,
    description: "A devotional brass idol of Sri Raghavendra Swami, the revered saint of the Madhwa tradition.",
  },
  {
    imgNo: 95,
    name: "Brass Balaji Lamp",
    categoryId: CATEGORY.lamp,
    price: 1260,
    description: "A beautifully crafted brass Balaji lamp, ideal for daily puja and festive illumination.",
  },
]

// ── GitHub helpers ────────────────────────────────────────────────────────────
function githubRequest(
  method: string,
  urlPath: string,
  body?: object
): Promise<{ statusCode: number; data: string }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined
    const options: https.RequestOptions = {
      hostname: "api.github.com",
      path: urlPath,
      method,
      headers: {
        "User-Agent": "jain-metals-image-uploader/1.0",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(payload
          ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
          : {}),
      },
    }
    const req = https.request(options, (res) => {
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
  const encoded = repoPath.split("/").map(encodeURIComponent).join("/")
  const { statusCode, data } = await githubRequest(
    "GET",
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encoded}?ref=${BRANCH}`
  )
  if (statusCode === 200) {
    try { return (JSON.parse(data) as { sha: string }).sha ?? null } catch { return null }
  }
  return null
}

async function uploadToGitHub(localPath: string, repoPath: string): Promise<string> {
  const base64Content = fs.readFileSync(localPath).toString("base64")
  const encoded = repoPath.split("/").map(encodeURIComponent).join("/")
  const existingSha = await getFileSha(repoPath)
  const body: Record<string, unknown> = {
    message: existingSha
      ? `chore: update ${path.basename(repoPath)}`
      : `chore: add ${path.basename(repoPath)}`,
    content: base64Content,
    branch: BRANCH,
  }
  if (existingSha) body.sha = existingSha
  const { statusCode, data } = await githubRequest(
    "PUT",
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encoded}`,
    body
  )
  if (statusCode !== 200 && statusCode !== 201) {
    let msg = data
    try { msg = (JSON.parse(data) as { message: string }).message } catch {}
    throw new Error(`GitHub [${statusCode}]: ${msg}`)
  }
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/${repoPath}`
}

// ── Slug helper ───────────────────────────────────────────────────────────────
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!GITHUB_TOKEN) { console.error("❌  GITHUB_TOKEN not set"); process.exit(1) }

  console.log("🚀  Adding 8 missing products + images\n")
  let created = 0, errors = 0

  for (const product of MISSING_PRODUCTS) {
    const fileName = `website ${String(product.imgNo).padStart(3, "0")}.webp`
    const localPath = path.join(IMAGES_DIR, fileName)
    const repoPath  = `${REPO_FOLDER}/website-${String(product.imgNo).padStart(3, "0")}.webp`

    process.stdout.write(`[${String(product.imgNo).padStart(3, "0")}] ${product.name.padEnd(30)} `)

    try {
      // 1. Upload image
      if (!fs.existsSync(localPath)) throw new Error(`Image file not found: ${fileName}`)
      const cdnUrl = await uploadToGitHub(localPath, repoPath)

      // 2. Create product in DB (upsert by slug to avoid duplicates)
      const slug = slugify(product.name)
      await prisma.product.upsert({
        where: { slug },
        create: {
          name: product.name,
          slug,
          description: product.description ?? `High-quality ${product.name} crafted in brass.`,
          categoryId: product.categoryId,
          price: product.price,
          stock: 10,
          images: [cdnUrl],
          isActive: true,
        },
        update: {
          images: [cdnUrl],
        },
      })

      // 3. Link to default collection
      const dbProduct = await prisma.product.findUnique({ where: { slug }, select: { id: true } })
      if (dbProduct) {
        await prisma.productCollection.upsert({
          where: {
            productId_collectionId: {
              productId: dbProduct.id,
              collectionId: DEFAULT_COLLECTION_ID,
            },
          },
          create: { productId: dbProduct.id, collectionId: DEFAULT_COLLECTION_ID },
          update: {},
        })
      }

      created++
      console.log(`✅  ${cdnUrl}`)
      await new Promise((r) => setTimeout(r, 1500))
    } catch (err: unknown) {
      errors++
      console.log(`❌  ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Also fix "Brass Deity Figurine" which is in DB but has no image
  // Image 016 ("BRASS ELEPHANTS WALL HANGING") was used for Balaji Wall Hanging —
  // "Brass Deity Figurine" maps to a generic BRASS entry (image 009 or 037).
  // Let's check which image numbers are still un-seeded.
  console.log("\n🔧  Fixing Brass Deity Figurine (image 009) …")
  try {
    const imgNo = 9
    const fileName = `website ${String(imgNo).padStart(3, "0")}.webp`
    const localPath = path.join(IMAGES_DIR, fileName)
    const repoPath  = `${REPO_FOLDER}/website-${String(imgNo).padStart(3, "0")}.webp`

    // Check if already uploaded
    const existingSha = await getFileSha(repoPath)
    let cdnUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/${repoPath}`
    if (!existingSha) {
      cdnUrl = await uploadToGitHub(localPath, repoPath)
    }

    await prisma.product.updateMany({
      where: { name: "Brass Deity Figurine", images: { equals: [] } },
      data: { images: [cdnUrl] },
    })
    console.log(`✅  Brass Deity Figurine → ${cdnUrl}`)
  } catch (err) {
    console.log(`❌  ${err instanceof Error ? err.message : String(err)}`)
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Created/updated : ${created}
❌  Errors          : ${errors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exit(1) })
  .finally(() => prisma.$disconnect())
