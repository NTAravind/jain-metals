/**
 * upload-images-github.ts
 *
 * 1. Reads scripts/image-map.json (imageNumber → productName from spreadsheet)
 * 2. For every DB product, fuzzy-matches a spreadsheet row to find its image file
 * 3. Uploads the corresponding webp to GitHub via the Contents API
 * 4. Writes the raw.githubusercontent.com CDN URL back to Product.images[]
 *
 * Run:
 *   npx tsx scripts/upload-images-github.ts
 *
 * Env vars required (in .env):
 *   GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO
 */

import "dotenv/config"
import * as fs from "fs"
import * as path from "path"
import * as https from "https"
import { PrismaClient } from "../app/generated/prisma/client"

const prisma = new PrismaClient()

// ── Config ────────────────────────────────────────────────────────────────────
const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.trim()!
// The token belongs to jainmetalscontact-pixel/jain-metals
const GITHUB_OWNER = "jainmetalscontact-pixel"
const GITHUB_REPO  = "jain-metals"
const IMAGES_DIR   = path.join(__dirname, "../images/HiCompress")
const IMAGE_MAP    = path.join(__dirname, "image-map.json")
// Branch where images will be committed
const BRANCH       = "main"
// Sub-folder inside the repo where images will be placed
const REPO_FOLDER  = "product-images"

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Token-overlap similarity score (0–1) between two normalised strings */
function similarity(a: string, b: string): number {
  const tokA = a.split(" ").filter(Boolean)
  const tokB = b.split(" ").filter(Boolean)
  const setA = new Set(tokA)
  const setB = new Set(tokB)
  let common = 0
  for (const t of setA) if (setB.has(t)) common++
  return common / Math.max(setA.size, setB.size)
}

/** Minimal GitHub REST request */
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
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload),
            }
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

/** Returns the file's current sha on GitHub, or null if it doesn't exist yet */
async function getFileSha(repoPath: string): Promise<string | null> {
  const encodedPath = repoPath.split("/").map(encodeURIComponent).join("/")
  const { statusCode, data } = await githubRequest(
    "GET",
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}?ref=${BRANCH}`
  )
  if (statusCode === 200) {
    try {
      return (JSON.parse(data) as { sha: string }).sha ?? null
    } catch {
      return null
    }
  }
  return null
}

/** Upload (create or update) a file on GitHub. Returns the raw CDN URL. */
async function uploadToGitHub(localPath: string, repoPath: string): Promise<string> {
  const base64Content = fs.readFileSync(localPath).toString("base64")
  const fileName = path.basename(repoPath)
  const encodedPath = repoPath.split("/").map(encodeURIComponent).join("/")
  const existingSha = await getFileSha(repoPath)

  const body: Record<string, unknown> = {
    message: existingSha
      ? `chore: update product image ${fileName}`
      : `chore: add product image ${fileName}`,
    content: base64Content,
    branch: BRANCH,
  }
  if (existingSha) body.sha = existingSha

  const { statusCode, data } = await githubRequest(
    "PUT",
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}`,
    body
  )

  if (statusCode !== 200 && statusCode !== 201) {
    let msg = data
    try { msg = (JSON.parse(data) as { message: string }).message } catch {}
    throw new Error(`GitHub [${statusCode}]: ${msg}`)
  }

  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/${repoPath}`
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!GITHUB_TOKEN) {
    console.error("❌  GITHUB_TOKEN not set in .env")
    process.exit(1)
  }

  // 1. Load the image-map (imageNumber → spreadsheet name)
  const imageMap: Record<string, string> = JSON.parse(fs.readFileSync(IMAGE_MAP, "utf8"))
  console.log(`📊  Loaded ${Object.keys(imageMap).length} image→name entries from image-map.json`)

  // 2. Build imageFiles map: number → filename  (e.g. 1 → "website 001.webp")
  const imageFiles = new Map<number, string>()
  fs.readdirSync(IMAGES_DIR)
    .filter((f) => f.endsWith(".webp"))
    .forEach((f) => {
      const m = f.match(/(\d+)\.webp$/)
      if (m) imageFiles.set(parseInt(m[1], 10), f)
    })

  // Helper: sanitise filename for GitHub (replace spaces with dashes)
  const sanitise = (f: string) => f.replace(/\s+/g, "-")
  console.log(`🖼️   Found ${imageFiles.size} image files in ${IMAGES_DIR}`)

  // 3. Load DB products
  console.log("\n🗄️   Loading products from DB …")
  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
    orderBy: { createdAt: "asc" },
    where: { name: { not: "demo" } },
  })
  console.log(`   → ${products.length} products`)

  // 4. Fuzzy-match: for each available image, find the best DB product
  console.log("\n🔗  Matching images → products …")
  const assignments = new Map<string, number>() // productId → imgNo
  const usedProductIds = new Set<string>()

  const sortedImgNos = Object.keys(imageMap)
    .map(Number)
    .filter((n) => imageFiles.has(n))
    .sort((a, b) => a - b)

  for (const imgNo of sortedImgNos) {
    const sheetName = imageMap[String(imgNo)]
    const normSheet = normalize(sheetName)
    let bestScore = 0
    let bestProduct: (typeof products)[0] | null = null

    for (const p of products) {
      if (usedProductIds.has(p.id)) continue
      const score = similarity(normSheet, normalize(p.name))
      if (score > bestScore) {
        bestScore = score
        bestProduct = p
      }
    }

    if (bestProduct && bestScore >= 0.4) {
      usedProductIds.add(bestProduct.id)
      assignments.set(bestProduct.id, imgNo)
    } else {
      console.log(
        `   ⚠️  No match for img ${String(imgNo).padStart(3, "0")}: "${sheetName}" (best ${Math.round(bestScore * 100)}%)`
      )
    }
  }

  console.log(`\n   ✅ Matched ${assignments.size} products to images`)
  console.log("\n🚀  Uploading to GitHub (jainmetalscontact-pixel/jain-metals) …\n")

  let uploaded = 0, errors = 0

  for (const [productId, imgNo] of assignments.entries()) {
    const fileName = imageFiles.get(imgNo)!
    const localPath = path.join(IMAGES_DIR, fileName)
    // Use sanitised name (no spaces) both in the repo path and CDN URL
    const repoPath  = `${REPO_FOLDER}/${sanitise(fileName)}`
    const product   = products.find((p) => p.id === productId)!

    process.stdout.write(
      `   [${String(imgNo).padStart(3, "0")}] ${product.name.slice(0, 34).padEnd(34)} `
    )

    try {
      const cdnUrl = await uploadToGitHub(localPath, repoPath)

      await prisma.product.update({
        where: { id: productId },
        data: { images: [cdnUrl] },
      })

      uploaded++
      console.log(`✅ ${cdnUrl}`)

      // Stay well within GitHub's 5,000 req/hr limit (2 req per upload)
      await new Promise((r) => setTimeout(r, 1500))
    } catch (err: unknown) {
      errors++
      console.log(`❌ ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Uploaded & seeded : ${uploaded}
❌  Errors            : ${errors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

main()
  .catch((err) => {
    console.error("Fatal:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
