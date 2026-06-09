import "dotenv/config";
import * as https from "https";
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.trim();
const GITHUB_OWNER = "jainmetalscontact-pixel";
const GITHUB_REPO  = "jain-metals";
const BRANCH       = "main";
const REPO_FOLDER  = "product-images";

function githubRequest(method: string, urlPath: string, body?: object): Promise<{ statusCode: number; data: string }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const options: https.RequestOptions = {
      hostname: "api.github.com",
      path: urlPath,
      method,
      headers: {
        "User-Agent": "jain-metals-image-checker/1.0",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(payload ? {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c: Buffer) => (data += c.toString()));
      res.on("end", () => resolve({ statusCode: res.statusCode ?? 0, data }));
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  type: string;
}

async function main() {
  if (!GITHUB_TOKEN) {
    console.error("❌ GITHUB_TOKEN is not defined in .env");
    process.exit(1);
  }

  console.log(`📡 Fetching contents of folder '${REPO_FOLDER}' from GitHub repo '${GITHUB_OWNER}/${GITHUB_REPO}'...`);
  const encodedPath = REPO_FOLDER.split("/").map(encodeURIComponent).join("/");
  const { statusCode, data } = await githubRequest(
    "GET",
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}?ref=${BRANCH}`
  );

  if (statusCode !== 200) {
    console.error(`❌ Failed to fetch folder. Status: ${statusCode}, Response: ${data}`);
    process.exit(1);
  }

  const files = JSON.parse(data) as GitHubFile[];
  console.log(`✅ Found ${files.length} items on GitHub in '${REPO_FOLDER}'.`);

  // Load all images currently used by active products in DB
  const dbProducts = await prisma.product.findMany({
    select: { images: true, name: true },
    where: { name: { not: "demo" } }
  });

  const usedImageUrls = new Set<string>();
  for (const p of dbProducts) {
    for (const img of p.images) {
      usedImageUrls.add(img);
    }
  }

  console.log(`📦 DB: Found ${dbProducts.length} products using ${usedImageUrls.size} unique image URLs.`);

  const toKeepNames = new Set<string>();
  // We want to keep website-001.webp through website-157.webp
  for (let i = 1; i <= 157; i++) {
    toKeepNames.add(`website-${String(i).padStart(3, "0")}.webp`);
  }

  console.log(`\n🔍 Analyzing files on GitHub...`);
  const extras: GitHubFile[] = [];
  const valid: GitHubFile[] = [];

  for (const f of files) {
    if (f.type !== "file") continue;
    if (toKeepNames.has(f.name)) {
      valid.push(f);
    } else {
      // Check if it's used in DB
      const cdnUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/${REPO_FOLDER}/${f.name}`;
      const isUsedInDb = usedImageUrls.has(cdnUrl);
      extras.push({ ...f, name: f.name + (isUsedInDb ? " (USED IN DB)" : " (UNUSED)") });
    }
  }

  console.log(`\n📊 Analysis Results:`);
  console.log(`- Valid files (website-001 to website-157): ${valid.length}`);
  console.log(`- Extra files found: ${extras.length}`);

  if (extras.length > 0) {
    console.log(`\n📂 Extra files details:`);
    for (const ext of extras) {
      console.log(`  - ${ext.name} (SHA: ${ext.sha})`);
    }
  } else {
    console.log(`\n🎉 No extra or duplicate files found!`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
