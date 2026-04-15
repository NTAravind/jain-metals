import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string, suffix?: string | number): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return suffix !== undefined ? `${base}-${suffix}` : base;
}

function parseWeightKg(raw?: string): number | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  const num = parseFloat(s.replace(/[^\d.]/g, ""));
  if (isNaN(num)) return null;
  if (s.includes("kilogram") || s.includes("kg")) return num;
  if (s.includes("gram")) return num / 1000;
  return null;
}

function parseHeightCm(raw?: string): number | null {
  if (!raw) return null;
  const nums = raw.match(/[\d.]+/g);
  if (!nums) return null;
  return Math.max(...nums.map(Number));
}

// ─── Category definitions ─────────────────────────────────────────────────────

const CATEGORY_DEFS = [
  { key: "ANNAPOORNA", name: "Annapoorna", slug: "annapoorna" },
  { key: "BALAJI", name: "Balaji", slug: "balaji" },
  { key: "BUDDHA", name: "Buddha", slug: "buddha" },
  { key: "COW_CALF", name: "Cow & Calf", slug: "cow-calf" },
  { key: "GANESHA", name: "Ganesha", slug: "ganesha" },
  { key: "KRISHNA", name: "Krishna", slug: "krishna" },
  { key: "LAKSHMI", name: "Lakshmi", slug: "lakshmi" },
  { key: "LAMP", name: "Lamp", slug: "lamp" },
  { key: "NATRAJ", name: "Natraj", slug: "natraj" },
  { key: "PARVATI", name: "Parvati", slug: "parvati" },
  { key: "RAGHAVENDRA", name: "Raghavendra", slug: "raghavendra" },
  { key: "ROYAL_BRASS", name: "Royal Brass", slug: "royal-brass" },
  { key: "SARASWATI", name: "Saraswati", slug: "saraswati" },
  { key: "TREE", name: "Tree", slug: "tree" },
  { key: "URLI", name: "Urli", slug: "urli" },
  { key: "VEHICLES", name: "Vehicles", slug: "vehicles" },
  { key: "WALL_HANGING", name: "Wall Hanging", slug: "wall-hanging" },
] as const;

type CategoryKey = (typeof CATEGORY_DEFS)[number]["key"];

// ─── Product data ─────────────────────────────────────────────────────────────

interface SizeVariantDef {
  dimensions: string;
  weight: string;
  price: number;
}

interface RawProduct {
  imageNo: number;
  name: string;
  categoryKey: CategoryKey;
  dimensions?: string;
  weight?: string;
  price: number;
  extraSizes?: SizeVariantDef[];
}

const PRODUCTS: RawProduct[] = [
  // ── Royal Brass ────────────────────────────────────────────────────────────
  { imageNo: 1, name: "Brass Tree Buddha", categoryKey: "ROYAL_BRASS", dimensions: '2.5"×3"×6.5"', weight: "350 Grams", price: 6300 },
  { imageNo: 3, name: "Brass Ganesha Lakshmi Saraswathi", categoryKey: "ROYAL_BRASS", dimensions: '1.25"×5.25"×2.75"', weight: "270 Grams", price: 4860 },
  { imageNo: 9, name: "Brass Deity", categoryKey: "ROYAL_BRASS", dimensions: '3.5"×4.5"×5.5"', weight: "500 Grams", price: 9000 },
  { imageNo: 10, name: "Brass Lakshmi", categoryKey: "ROYAL_BRASS", dimensions: '4"×3"×4"', weight: "330 Grams", price: 5940 },
  { imageNo: 11, name: "Brass Saraswati", categoryKey: "ROYAL_BRASS", dimensions: '4"×3"×4"', weight: "320 Grams", price: 5760 },
  { imageNo: 23, name: "Brass Ashtalakshmi Kalash", categoryKey: "ROYAL_BRASS", dimensions: '5"×5"×5.5"', weight: "400 Grams", price: 7200 },
  { imageNo: 27, name: "Brass Swing Radha Krishna", categoryKey: "ROYAL_BRASS", dimensions: '3"×4.5"×6"', weight: "550 Grams", price: 9900 },
  { imageNo: 28, name: "Brass Lakshmi Small", categoryKey: "ROYAL_BRASS", dimensions: '2"×2"×3"', weight: "120 Grams", price: 2160 },
  { imageNo: 29, name: "Brass Murugan", categoryKey: "ROYAL_BRASS", dimensions: '1.5"×1.75"×3"', weight: "80 Grams", price: 1440 },
  { imageNo: 30, name: "Brass Hanuman", categoryKey: "ROYAL_BRASS", dimensions: '3"×3"×3"', weight: "200 Grams", price: 3600 },
  { imageNo: 31, name: "Brass Lakshmi Ganesha", categoryKey: "ROYAL_BRASS", dimensions: '1"×4.5"×3"', weight: "200 Grams", price: 3600 },
  { imageNo: 32, name: "Brass Ganesha", categoryKey: "ROYAL_BRASS", dimensions: '4"×3"×4"', weight: "350 Grams", price: 6300 },
  {
    imageNo: 33, name: "Brass Annapoorneshwari", categoryKey: "ROYAL_BRASS",
    dimensions: '1"×1.5"×1.75"', weight: "40 Grams", price: 720,
    extraSizes: [{ dimensions: '1.5"×2"×3"', weight: "100 Grams", price: 1800 }],
  },
  {
    imageNo: 34, name: "Brass Ganesha Three Sizes", categoryKey: "ROYAL_BRASS",
    dimensions: '1"×1.5"×2"', weight: "40 Grams", price: 720,
    extraSizes: [
      { dimensions: '1.5"×2"×3"', weight: "100 Grams", price: 1800 },
      { dimensions: '2"×3"×4"', weight: "220 Grams", price: 3960 },
    ],
  },
  {
    imageNo: 36, name: "Brass Hanuman Three Sizes", categoryKey: "ROYAL_BRASS",
    dimensions: '1.75"×1.75"×2.5"', weight: "90 Grams", price: 1620,
    extraSizes: [
      { dimensions: '2.5"×3"×3.5"', weight: "200 Grams", price: 3600 },
      { dimensions: '3"×3"×4.5"', weight: "400 Grams", price: 7200 },
    ],
  },
  { imageNo: 37, name: "Brass Deity Figurine", categoryKey: "ROYAL_BRASS", dimensions: '2"×2.75"×4"', weight: "150 Grams", price: 2700 },
  { imageNo: 38, name: "Brass Kubera", categoryKey: "ROYAL_BRASS", dimensions: '2.5"×2"×3"', weight: "120 Grams", price: 2160 },
  {
    imageNo: 39, name: "Brass Radha Krishna", categoryKey: "ROYAL_BRASS",
    dimensions: '1.75"×2.5"×4"', weight: "170 Grams", price: 3060,
    extraSizes: [{ dimensions: '3"×4"×6"', weight: "550 Grams", price: 9900 }],
  },
  { imageNo: 40, name: "Brass Ganesha Seated", categoryKey: "ROYAL_BRASS", dimensions: '1.75"×2.5"×3"', weight: "170 Grams", price: 3060 },
  { imageNo: 41, name: "Brass Ardhnaari", categoryKey: "ROYAL_BRASS", dimensions: '2"×3.5"×4.5"', weight: "120 Grams", price: 2160 },
  {
    imageNo: 60, name: "Brass Vishnu Lakshmi", categoryKey: "ROYAL_BRASS",
    dimensions: '2"×3"×3"', weight: "170 Grams", price: 3000,
    extraSizes: [{ dimensions: '2.5"×4"×4"', weight: "300 Grams", price: 5400 }],
  },
  { imageNo: 62, name: "Brass Kamadhenu", categoryKey: "ROYAL_BRASS", dimensions: '1"×2.25"×3"', weight: "120 Grams", price: 2160 },
  { imageNo: 71, name: "Brass Vishnu", categoryKey: "ROYAL_BRASS", dimensions: '2.25"×4"×2"', weight: "180 Grams", price: 3240 },
  { imageNo: 74, name: "Brass Balaji Small", categoryKey: "ROYAL_BRASS", dimensions: '1"×3.5"×3.5"', weight: "90 Grams", price: 1620 },
  { imageNo: 79, name: "Brass Saraswati Large", categoryKey: "ROYAL_BRASS", dimensions: '3.5"×4.5"×7"', weight: "1.150 Kilograms", price: 3600 },
  { imageNo: 80, name: "Brass Shankh", categoryKey: "ROYAL_BRASS", dimensions: '4.25"×2.25"×2"', weight: "150 Grams", price: 2700 },
  { imageNo: 81, name: "Brass Ganesha Premium", categoryKey: "ROYAL_BRASS", dimensions: '4"×4"×7.5"', weight: "1.000 Kilograms", price: 18000 },
  { imageNo: 82, name: "Brass Lakshmi Premium", categoryKey: "ROYAL_BRASS", dimensions: '4"×4"×7.5"', weight: "950 Grams", price: 17100 },
  { imageNo: 137, name: "Brass Lakshmi Balaji Glass", categoryKey: "ROYAL_BRASS", dimensions: '3"×3"×3"', weight: "130 Grams", price: 2080 },

  // ── Vehicles ───────────────────────────────────────────────────────────────
  { imageNo: 4, name: "Brass Chariot", categoryKey: "VEHICLES", dimensions: '2.75"×4.5"×3"', weight: "420 Grams", price: 2100 },
  { imageNo: 5, name: "Brass Bullock Cart", categoryKey: "VEHICLES", dimensions: '2.5"×4.5"×2"', weight: "330 Grams", price: 1650 },
  { imageNo: 6, name: "Brass Horse Cart", categoryKey: "VEHICLES", dimensions: '2.75"×8"×4"', weight: "820 Grams", price: 4100 },
  { imageNo: 7, name: "Brass Vintage Car", categoryKey: "VEHICLES", dimensions: '2.25"×4.5"×2.25"', weight: "550 Grams", price: 2750 },
  { imageNo: 8, name: "Brass Bullock Cart Large", categoryKey: "VEHICLES", dimensions: '2.5"×5"×2.5"', weight: "350 Grams", price: 1750 },

  // ── Wall Hanging ───────────────────────────────────────────────────────────
  { imageNo: 14, name: "Brass Hanuman Wall Hanging", categoryKey: "WALL_HANGING", dimensions: '6"×7"×0.5"', weight: "750 Grams", price: 3750 },
  { imageNo: 15, name: "Brass Lotus Wall Hanging", categoryKey: "WALL_HANGING", dimensions: '5"×6.25"×1"', weight: "800 Grams", price: 4000 },
  { imageNo: 16, name: "Brass Elephants Wall Hanging", categoryKey: "WALL_HANGING", dimensions: '3.5"×5"', weight: "550 Grams", price: 2750 },
  { imageNo: 17, name: "Brass Kalash Wall Hanging", categoryKey: "WALL_HANGING", dimensions: '8"×5.5"', weight: "920 Grams", price: 4600 },
  { imageNo: 18, name: "Brass Cow-Calf Wall Hanging", categoryKey: "WALL_HANGING", dimensions: '5.5"×7.5"', weight: "1.000 Kilograms", price: 5000 },
  { imageNo: 19, name: "Brass Kalash", categoryKey: "WALL_HANGING", dimensions: '7.5"×4"', weight: "450 Grams", price: 2250 },
  { imageNo: 24, name: "Brass Buddha Wall Hanging Large", categoryKey: "WALL_HANGING", dimensions: '15.5"×10"×2.5"', weight: "4.750 Kilograms", price: 23750 },
  { imageNo: 44, name: "Brass Balaji Wall Hanging", categoryKey: "WALL_HANGING", dimensions: '16"×12"×3"', weight: "3.300 Kilograms", price: 16500 },
  { imageNo: 45, name: "Brass Tree Wall Hanging", categoryKey: "WALL_HANGING", dimensions: '14"×13"×1"', weight: "2.700 Kilograms", price: 13500 },
  { imageNo: 48, name: "Brass Peacock Wall Hanging", categoryKey: "WALL_HANGING", dimensions: '9"×9"', weight: "950 Grams", price: 4750 },
  { imageNo: 86, name: "Brass Buddha Wall Hanging", categoryKey: "WALL_HANGING", dimensions: '8.5"×6.5"×3"', weight: "1.600 Kilograms", price: 7200 },
  { imageNo: 87, name: "Brass Krishna Wall Hanging", categoryKey: "WALL_HANGING", dimensions: '11"×6"×2"', weight: "2.000 Kilograms", price: 8000 },
  { imageNo: 88, name: "Brass Om Ganesha Hanging", categoryKey: "WALL_HANGING", dimensions: '8"×8.5"×0.5"', weight: "1.350 Kilograms", price: 6750 },
  { imageNo: 89, name: "Brass Kalash Wall Hanging Large", categoryKey: "WALL_HANGING", dimensions: '7.5"×6"×2"', weight: "1.5 Kilograms", price: 7500 },
  { imageNo: 133, name: "Brass Ashtalakshmi Wall Hanging", categoryKey: "WALL_HANGING", dimensions: '11.5"×10"×1"', weight: "2.100 Kilograms", price: 10500 },

  // ── Ganesha ────────────────────────────────────────────────────────────────
  { imageNo: 20, name: "Brass Ganesha Large", categoryKey: "GANESHA", dimensions: '4"×7"×8.5"', weight: "3.000 Kilograms", price: 6000 },
  { imageNo: 22, name: "Brass Swing Ganesha", categoryKey: "GANESHA", dimensions: '3"×6"×9.5"', weight: "1.800 Kilograms", price: 9000 },

  // ── Buddha ─────────────────────────────────────────────────────────────────
  { imageNo: 21, name: "Brass Buddha", categoryKey: "BUDDHA", dimensions: '5.5"×9"×12"', weight: "5.700 Kilograms", price: 10250 },

  // ── Urli ───────────────────────────────────────────────────────────────────
  { imageNo: 25, name: "Brass Urli", categoryKey: "URLI", dimensions: '8"×6"×6"', weight: "1.2 Kilograms", price: 6000 },

  // ── Lakshmi ────────────────────────────────────────────────────────────────
  { imageNo: 26, name: "Brass Lakshmi Standing", categoryKey: "LAKSHMI", dimensions: '4.5"×6"×12"', weight: "4.000 Kilograms", price: 8000 },
  { imageNo: 55, name: "Brass Lakshmi Seated", categoryKey: "LAKSHMI", dimensions: '4"×4"×5"', weight: "1.300 Kilograms", price: 6500 },

  // ── Balaji ─────────────────────────────────────────────────────────────────
  { imageNo: 42, name: "Brass Balaji", categoryKey: "BALAJI", dimensions: '2.5"×2"×9.5"', weight: "1.450 Kilograms", price: 7250 },

  // ── Annapoorna ─────────────────────────────────────────────────────────────
  { imageNo: 43, name: "Brass Annapoorna Devi", categoryKey: "ANNAPOORNA", dimensions: '6.5"×5"×10"', weight: "4.150 Kilograms", price: 20750 },

  // ── Natraj ─────────────────────────────────────────────────────────────────
  { imageNo: 49, name: "Brass Natraj", categoryKey: "NATRAJ", dimensions: '5"×2.5"×6.5"', weight: "720 Grams", price: 3800 },

  // ── Parvati ────────────────────────────────────────────────────────────────
  { imageNo: 51, name: "Brass Parvati", categoryKey: "PARVATI", dimensions: '5.75"×5.5"×9.5"', weight: "2.850 Kilograms", price: 12800 },

  // ── Krishna ────────────────────────────────────────────────────────────────
  { imageNo: 53, name: "Brass Krishna", categoryKey: "KRISHNA", dimensions: '3.5"×2.75"×7"', weight: "950 Grams", price: 4750 },
  { imageNo: 61, name: "Brass Cow Krishna", categoryKey: "KRISHNA", dimensions: '3.5"×5.5"×7.5"', weight: "2.250 Kilograms", price: 11250 },
  { imageNo: 136, name: "Brass Krishna Tall", categoryKey: "KRISHNA", dimensions: '3"×5"×9"', weight: "1.650 Kilograms", price: 8250 },

  // ── Saraswati ──────────────────────────────────────────────────────────────
  { imageNo: 54, name: "Brass Saraswati", categoryKey: "SARASWATI", dimensions: '4"×4"×5"', weight: "1.250 Kilograms", price: 6250 },

  // ── Lamp ───────────────────────────────────────────────────────────────────
  { imageNo: 50, name: "Brass Lamp", categoryKey: "LAMP", dimensions: '3.5"×5"×7.5"', weight: "650 Grams", price: 3250 },
  { imageNo: 52, name: "Brass Peacock Lamp", categoryKey: "LAMP", dimensions: '3.25"×3.25"×5"', weight: "500 Grams", price: 2000 },
  { imageNo: 57, name: "Brass Ganesha Lamp", categoryKey: "LAMP", dimensions: '5.5"×5"×7"', weight: "1.200 Kilograms", price: 4800 },
  { imageNo: 58, name: "Brass Lakshmi Lamp Tall", categoryKey: "LAMP", dimensions: '6"×6"×11"', weight: "2.150 Kilograms", price: 8600 },
  { imageNo: 63, name: "Brass Lakshmi Lamp", categoryKey: "LAMP", dimensions: '2.25"×2.25"×3.5"', weight: "130 Grams", price: 2340 },
  { imageNo: 64, name: "Brass Lakshmi Lamp Compact", categoryKey: "LAMP", dimensions: '2.25"×2.5"×3"', weight: "90 Grams", price: 1620 },
  { imageNo: 67, name: "Brass Lakshmi Lamp Pillar", categoryKey: "LAMP", dimensions: '2.5"×2.25"×4.5"', weight: "120 Grams", price: 2160 },
  {
    imageNo: 69, name: "Brass Tortoise Lamp", categoryKey: "LAMP",
    dimensions: '2"×1.25"×1.25"', weight: "35 Grams", price: 630,
    extraSizes: [{ dimensions: '2.25"×1.75"×1.5"', weight: "60 Grams", price: 1080 }],
  },
  { imageNo: 72, name: "Brass Peacock Lamp Mini", categoryKey: "LAMP", dimensions: '3"×3"×5.5"', weight: "80 Grams", price: 1440 },
  { imageNo: 73, name: "Brass Elephant Lamp", categoryKey: "LAMP", dimensions: '2.5"×2.5"×3"', weight: "130 Grams", price: 2340 },
  { imageNo: 75, name: "Brass Lamp Plain", categoryKey: "LAMP", dimensions: '2.5"×2.25"×1.5"', weight: "90 Grams", price: 1620 },
  { imageNo: 76, name: "Brass Shankh Chakra Lamp", categoryKey: "LAMP", dimensions: '2.5"×2.5"×4"', weight: "110 Grams", price: 1980 },
  { imageNo: 77, name: "Brass Lakshmi Lamp Ornate", categoryKey: "LAMP", dimensions: '3"×2.25"×3.5"', weight: "110 Grams", price: 1980 },
  { imageNo: 83, name: "Brass Swastik Lamp", categoryKey: "LAMP", dimensions: '2.5"×2.5"×1.5"', weight: "70 Grams", price: 1260 },
  { imageNo: 84, name: "Brass Peacock Lamp Medium", categoryKey: "LAMP", dimensions: '2.5"×2.5"×5"', weight: "160 Grams", price: 2880 },
  {
    imageNo: 85, name: "Brass Ashtalakshmi Lamp", categoryKey: "LAMP",
    dimensions: '3"×3"×5.5"', weight: "150 Grams", price: 2700,
    extraSizes: [{ dimensions: '5"×5"×7.5"', weight: "350 Grams", price: 6300 }],
  },
  { imageNo: 91, name: "Brass Peacock Lamp Slender", categoryKey: "LAMP", dimensions: '4.5"×1.5"×3.25"', weight: "110 Grams", price: 1760 },
  { imageNo: 93, name: "Brass Ganesha Lamp Round", categoryKey: "LAMP", dimensions: '3.25"×3"×5.5"', weight: "200 Grams", price: 3600 },
  { imageNo: 94, name: "Brass Lakshmi Lamp Round", categoryKey: "LAMP", dimensions: '3.25"×3"×5.5"', weight: "200 Grams", price: 3600 },
  { imageNo: 95, name: "Brass Balaji Lamp", categoryKey: "LAMP", dimensions: '2"×1"×3.5"', weight: "70 Grams", price: 1260 },
  { imageNo: 135, name: "Brass Peacock Lamp Large", categoryKey: "LAMP", dimensions: '9"×4.5"×7.5"', weight: "1.700 Kilograms", price: 8500 },

  // ── Tree ───────────────────────────────────────────────────────────────────
  { imageNo: 59, name: "Brass Tree", categoryKey: "TREE", dimensions: '2.5"×7.5"×8.5"', weight: "1.200 Kilograms", price: 5400 },

  // ── Cow & Calf ─────────────────────────────────────────────────────────────
  { imageNo: 65, name: "Brass Cow-Calf Small", categoryKey: "COW_CALF", dimensions: '1"×2"×1.5"', weight: "40 Grams", price: 720 },
  {
    imageNo: 66, name: "Brass Cow-Calf", categoryKey: "COW_CALF",
    dimensions: '1.75"×2.75"×2.25"', weight: "120 Grams", price: 2160,
    extraSizes: [{ dimensions: '2.5"×3.5"×3"', weight: "230 Grams", price: 4140 }],
  },
  { imageNo: 96, name: "Brass Cow-Calf Premium", categoryKey: "COW_CALF", dimensions: '4"×7"×5"', weight: "2.45 Kilograms", price: 12250 },
  {
    imageNo: 97, name: "Brass Cow-Calf Duo", categoryKey: "COW_CALF",
    dimensions: '3.5"×5"×3.5"', weight: "1.100 Kilograms", price: 5500,
    extraSizes: [{ dimensions: '4.5"×6"×4.5"', weight: "2.000 Kilograms", price: 10000 }],
  },
  { imageNo: 98, name: "Brass Cow and Calf", categoryKey: "COW_CALF", dimensions: '3.5"×5"×3.5"', weight: "1.100 Kilograms", price: 5500 },
  { imageNo: 99, name: "Brass Cow and Calf Large", categoryKey: "COW_CALF", dimensions: '3"×5"×5"', weight: "2.100 Kilograms", price: 10500 },
  { imageNo: 134, name: "Brass Cow and Calf XL", categoryKey: "COW_CALF", dimensions: '4.5"×8"×6.5"', weight: "3.750 Kilograms", price: 18750 },

  // ── Raghavendra ────────────────────────────────────────────────────────────
  {
    imageNo: 92, name: "Brass Raghavendra", categoryKey: "RAGHAVENDRA",
    dimensions: '0.75"×1.5"×2.25"', weight: "200 Grams", price: 1000,
    extraSizes: [
      { dimensions: '2"×2.5"×4"', weight: "750 Grams", price: 3750 },
      { dimensions: '1.75"×4.5"×5.5"', weight: "1.300 Kilograms", price: 6500 },
    ],
  },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

export async function seedAdmin() {
  // 1. Upsert categories → build key→id map
  console.log("\n📂 Seeding categories…");
  const CAT: Record<string, string> = {};

  for (const cat of CATEGORY_DEFS) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    });
    CAT[cat.key] = record.id;
    console.log(`   ✔ ${cat.name} (${record.id})`);
  }

  // 2. Upsert products + sync SizeVariants
  console.log(`\n🌱 Seeding ${PRODUCTS.length} products…\n`);
  const usedSlugs = new Set<string>();

  for (const raw of PRODUCTS) {
    // Deduplicate slugs
    let slug = slugify(raw.name);
    if (usedSlugs.has(slug)) slug = slugify(raw.name, raw.imageNo);
    usedSlugs.add(slug);

    // Build description
    const lines: string[] = [`Handcrafted brass piece. Image #${raw.imageNo}.`];
    if (raw.dimensions) lines.push(`Dimensions: ${raw.dimensions}.`);
    if (raw.weight) lines.push(`Weight: ${raw.weight}.`);

    // Upsert the product
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name: raw.name,
        categoryId: CAT[raw.categoryKey],
        price: raw.price,
        weightKg: parseWeightKg(raw.weight),
        heightCm: parseHeightCm(raw.dimensions),
        description: lines.join(" "),
      },
      create: {
        name: raw.name,
        slug,
        categoryId: CAT[raw.categoryKey],
        description: lines.join(" "),
        price: raw.price,
        stock: 10,
        weightKg: parseWeightKg(raw.weight),
        heightCm: parseHeightCm(raw.dimensions),
        isActive: true,
      },
    });

    // Sync SizeVariants — wipe & recreate so data is always in sync with this file
    await prisma.sizeVariant.deleteMany({ where: { productId: product.id } });

    if (raw.extraSizes?.length) {
      await prisma.sizeVariant.createMany({
        data: raw.extraSizes.map((sv, i) => ({
          productId: product.id,
          name: `${sv.dimensions} / ${sv.weight}`,
          price: sv.price,
          stock: 10,
          sortOrder: i + 1,
        })),
      });
      console.log(`   ✔ ${raw.name} (₹${raw.price.toLocaleString("en-IN")}) + ${raw.extraSizes.length} variant(s)`);
    } else {
      console.log(`   ✔ ${raw.name} (₹${raw.price.toLocaleString("en-IN")})`);
    }
  }

  console.log("\n✅  Done.\n");
}