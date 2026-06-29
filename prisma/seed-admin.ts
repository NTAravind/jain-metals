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
  if (s.includes("kilogram") || s.includes("kg") || s.includes("kilo gram")) return num;
  if (s.includes("gram") || s.includes("grama") || s.includes("grmas")) return num / 1000;
  return null;
}

// ─── Category definitions ─────────────────────────────────────────────────────

const CATEGORY_DEFS = [
  { key: "ANNAPOORNA",   name: "Annapoorna",    slug: "annapoorna"    },
  { key: "BALAJI",       name: "Balaji",         slug: "balaji"        },
  { key: "BUDDHA",       name: "Buddha",         slug: "buddha"        },
  { key: "COW_CALF",     name: "Cow & Calf",     slug: "cow-calf"      },
  { key: "COW_AND_CALF", name: "Cow and Calf",   slug: "cow-and-calf"  },
  { key: "DECOR",        name: "Decor",          slug: "decor"         },
  { key: "GANESHA",      name: "Ganesha",        slug: "ganesha"       },
  { key: "HANUMAN",      name: "Hanuman",        slug: "hanuman"       },
  { key: "KRISHNA",      name: "Krishna",        slug: "krishna"       },
  { key: "LAKSHMI",      name: "Lakshmi",        slug: "lakshmi"       },
  { key: "LALITHA_DEVI", name: "Lalitha Devi",   slug: "lalitha-devi"  },
  { key: "LAMP",         name: "Lamp",           slug: "lamp"          },
  { key: "NATRAJ",       name: "Natraj",         slug: "natraj"        },
  { key: "PARVATI",      name: "Parvati",        slug: "parvati"       },
  { key: "RAGHAVENDRA",  name: "Raghavendra",    slug: "raghavendra"   },
  { key: "RAM",          name: "Ram",            slug: "ram"           },
  { key: "ROYAL_BRASS",  name: "Royal Brass",    slug: "royal-brass"   },
  { key: "SARASWATI",    name: "Saraswati",      slug: "saraswati"     },
  { key: "TREE",         name: "Tree",           slug: "tree"          },
  { key: "URLI",         name: "Urli",           slug: "urli"          },
  { key: "VARAHI",       name: "Varahi",         slug: "varahi"        },
  { key: "VEHICLES",     name: "Vehicles",       slug: "vehicles"      },
  { key: "WALL_HANGING", name: "Wall Hanging",   slug: "wall-hanging"  },
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
  { imageNo: 1,   name: "Brass Tree Buddha",                categoryKey: "ROYAL_BRASS", dimensions: '2.5"×3"×6.5"',        weight: "350 Grams",        price: 6300 },
  { imageNo: 2,   name: "Brass Ganesha",                    categoryKey: "ROYAL_BRASS", dimensions: '2.5"×2.75"×4"',       weight: "220 Grams",        price: 3960 },
  { imageNo: 3,   name: "Brass Ganesha Lakshmi Saraswathi", categoryKey: "ROYAL_BRASS", dimensions: '1.25"×5.25"×2.75"',   weight: "270 Grams",        price: 4860 },
  { imageNo: 9,   name: "Brass Deity",                      categoryKey: "ROYAL_BRASS", dimensions: '3.5"×4.5"×5.5"',     weight: "500 Grams",        price: 9000 },
  { imageNo: 10,  name: "Brass Lakshmi",                    categoryKey: "ROYAL_BRASS", dimensions: '4"×3"×4"',            weight: "330 Grams",        price: 5940 },
  { imageNo: 11,  name: "Brass Saraswati",                  categoryKey: "ROYAL_BRASS", dimensions: '4"×3"×4"',            weight: "320 Grams",        price: 5760 },
  { imageNo: 23,  name: "Brass Ashtalakshmi Kalash",        categoryKey: "ROYAL_BRASS", dimensions: '5"×5"×5.5"',          weight: "400 Grams",        price: 7200 },
  { imageNo: 27,  name: "Brass Swing Radha Krishna",        categoryKey: "ROYAL_BRASS", dimensions: '3"×4.5"×6"',          weight: "550 Grams",        price: 9900 },
  { imageNo: 28,  name: "Brass Lakshmi Small",              categoryKey: "ROYAL_BRASS", dimensions: '2"×2"×3"',            weight: "120 Grams",        price: 2160 },
  { imageNo: 29,  name: "Brass Murugan",                    categoryKey: "ROYAL_BRASS", dimensions: '1.5"×1.75"×3"',       weight: "80 Grams",         price: 1440 },
  { imageNo: 30,  name: "Brass Hanuman",                    categoryKey: "ROYAL_BRASS", dimensions: '3"×3"×3"',            weight: "200 Grams",        price: 3600 },
  { imageNo: 31,  name: "Brass Lakshmi Ganesha",            categoryKey: "ROYAL_BRASS", dimensions: '1"×4.5"×3"',          weight: "200 Grams",        price: 3600 },
  { imageNo: 32,  name: "Brass Ganesha",                    categoryKey: "ROYAL_BRASS", dimensions: '4"×3"×4"',            weight: "350 Grams",        price: 6300 },
  {
    imageNo: 33, name: "Brass Annapoorneshwari", categoryKey: "ROYAL_BRASS",
    dimensions: '1"×1.5"×1.75"', weight: "40 Grams", price: 720,
    extraSizes: [
      { dimensions: '1.5"×2"×3"', weight: "100 Grams", price: 1800 },
    ],
  },
  {
    imageNo: 34, name: "Brass Ganesha Three Sizes", categoryKey: "ROYAL_BRASS",
    dimensions: '1"×1.5"×2"', weight: "40 Grams", price: 720,
    extraSizes: [
      { dimensions: '1.5"×2"×3"', weight: "100 Grams", price: 1800 },
      { dimensions: '2"×3"×4"',   weight: "220 Grams", price: 3960 },
    ],
  },
  {
    imageNo: 36, name: "Brass Hanuman Three Sizes", categoryKey: "ROYAL_BRASS",
    dimensions: '1.75"×1.75"×2.5"', weight: "90 Grams", price: 1620,
    extraSizes: [
      { dimensions: '2.5"×3"×3.5"', weight: "200 Grams", price: 3600 },
      { dimensions: '3"×3"×4.5"',   weight: "400 Grams", price: 7200 },
    ],
  },
  { imageNo: 37,  name: "Brass Deity Figurine",             categoryKey: "ROYAL_BRASS", dimensions: '2"×2.75"×4"',         weight: "150 Grams",        price: 2700 },
  { imageNo: 38,  name: "Brass Kubera",                     categoryKey: "ROYAL_BRASS", dimensions: '2.5"×2"×3"',          weight: "120 Grams",        price: 2160 },
  {
    imageNo: 39, name: "Brass Radha Krishna", categoryKey: "ROYAL_BRASS",
    dimensions: '1.75"×2.5"×4"', weight: "170 Grams", price: 3060,
    extraSizes: [
      { dimensions: '3"×4"×6"', weight: "550 Grams", price: 9900 },
    ],
  },
  { imageNo: 40,  name: "Brass Ganesha Seated",             categoryKey: "ROYAL_BRASS", dimensions: '1.75"×2.5"×3"',       weight: "170 Grams",        price: 3060 },
  { imageNo: 41,  name: "Brass Ardhnaari",                  categoryKey: "ROYAL_BRASS", dimensions: '2"×3.5"×4.5"',        weight: "120 Grams",        price: 2160 },
  {
    imageNo: 60, name: "Brass Vishnu Lakshmi", categoryKey: "ROYAL_BRASS",
    dimensions: '2"×3"×3"', weight: "170 Grams", price: 3000,
    extraSizes: [
      { dimensions: '2.5"×4"×4"', weight: "300 Grams", price: 5400 },
    ],
  },
  { imageNo: 62,  name: "Brass Kamadhenu",                  categoryKey: "ROYAL_BRASS", dimensions: '1"×2.25"×3"',         weight: "120 Grams",        price: 2160 },
  { imageNo: 71,  name: "Brass Vishnu",                     categoryKey: "ROYAL_BRASS", dimensions: '2.25"×4"×2"',         weight: "180 Grams",        price: 3240 },
  { imageNo: 74,  name: "Brass Balaji Small",               categoryKey: "ROYAL_BRASS", dimensions: '1"×3.5"×3.5"',        weight: "90 Grams",         price: 1620 },
  { imageNo: 79,  name: "Brass Saraswati Large",            categoryKey: "ROYAL_BRASS", dimensions: '3.5"×4.5"×7"',        weight: "1.150 Kilograms",  price: 20700 },
  { imageNo: 80,  name: "Brass Shankh",                     categoryKey: "ROYAL_BRASS", dimensions: '4.25"×2.25"×2"',      weight: "150 Grams",        price: 2700 },
  { imageNo: 81,  name: "Brass Ganesha Premium",            categoryKey: "ROYAL_BRASS", dimensions: '4"×4"×7.5"',          weight: "1.000 Kilograms",  price: 18000 },
  { imageNo: 82,  name: "Brass Lakshmi Premium",            categoryKey: "ROYAL_BRASS", dimensions: '4"×4"×7.5"',          weight: "950 Grams",        price: 17100 },
  { imageNo: 130, name: "Brass Tortoise",                   categoryKey: "ROYAL_BRASS", dimensions: '6"×4"×2.5"',          weight: "420 Grams",        price: 7500 },
  { imageNo: 137, name: "Brass Lakshmi Balaji Glass",       categoryKey: "ROYAL_BRASS", dimensions: '3"×3"×3"',            weight: "130 Grams",        price: 2080 },
  { imageNo: 154, name: "Brass Krishna With Cow",           categoryKey: "ROYAL_BRASS", dimensions: '5"×5"×4"',            weight: "630 Grams",        price: 11300 },
  {
    imageNo: 107, name: "Brass Balaji", categoryKey: "ROYAL_BRASS",
    dimensions: '1.25"×1"×4"', weight: "120 Grams", price: 2160,
    extraSizes: [
      { dimensions: '2"×1.5"×6"', weight: "300 Grams", price: 5400 },
    ],
  },
  {
    imageNo: 108, name: "Brass Vishnu", categoryKey: "ROYAL_BRASS",
    dimensions: '1.25"×1"×4"', weight: "090 Grams", price: 1600,
    extraSizes: [
      { dimensions: '1.75"×1.75"×6"', weight: "240 Grams", price: 4320 },
      { dimensions: '2"×2"×7"',        weight: "330 Grams", price: 5940 },
    ],
  },
  {
    imageNo: 109, name: "Brass Krishna", categoryKey: "ROYAL_BRASS",
    dimensions: '1.5"×2"×5"', weight: "150 Grams", price: 2700,
    extraSizes: [
      { dimensions: '3"×3.5"×9.5"', weight: "700 Grams", price: 12600 },
    ],
  },
  {
    imageNo: 110, name: "Brass Lakshmi", categoryKey: "ROYAL_BRASS",
    dimensions: '1"×1"×4"', weight: "080 Grams", price: 1500,
    extraSizes: [
      { dimensions: '1.25"×1.5"×5"', weight: "120 Grams", price: 2200 },
    ],
  },
  { imageNo: 111, name: "Brass Krishna",           categoryKey: "ROYAL_BRASS", dimensions: '1.5"×1.5"×5"',       weight: "120 Grams",        price: 2200 },
  {
    imageNo: 112, name: "Brass Sai Baba", categoryKey: "ROYAL_BRASS",
    dimensions: '1.5"×1.5"×2"', weight: "050 Grams", price: 900,
    extraSizes: [
      { dimensions: '2.5"×2.5"×3"', weight: "150 Grams", price: 2700 },
    ],
  },
  { imageNo: 113, name: "Brass Krishna",           categoryKey: "ROYAL_BRASS", dimensions: '1.5"×2"×3"',         weight: "080 Grams",        price: 1500 },
  {
    imageNo: 114, name: "Brass Shivling", categoryKey: "ROYAL_BRASS",
    dimensions: '2"×1.75"×2.5"', weight: "080 Grams", price: 1500,
    extraSizes: [
      { dimensions: '4.5"×2"×4"', weight: "220 Grams", price: 4000 },
    ],
  },
  {
    imageNo: 115, name: "Brass Vishnu Pada", categoryKey: "ROYAL_BRASS",
    dimensions: '2.5"×2.5"×2"', weight: "050 Grams", price: 900,
    extraSizes: [
      { dimensions: '3"×3"×2.5"',     weight: "080 Grams", price: 1500 },
      { dimensions: '3.5"×3.5"×2.5"', weight: "140 Grams", price: 2500 },
    ],
  },
  { imageNo: 116, name: "Brass Butter Krishna",    categoryKey: "ROYAL_BRASS", dimensions: '3.5"×3.5"×3.5"',    weight: "190 Grams",        price: 3500 },
  { imageNo: 119, name: "Brass Lakshmi Narsimha",  categoryKey: "ROYAL_BRASS", dimensions: '1.5"×2.25"×4"',     weight: "220 Grams",        price: 4000 },
  { imageNo: 120, name: "Brass Sai Baba",          categoryKey: "ROYAL_BRASS", dimensions: '1"×1"×3"',          weight: "080 Grams",        price: 1500 },
  { imageNo: 121, name: "Brass Balaji",            categoryKey: "ROYAL_BRASS", dimensions: '1"×4"×6"',          weight: "340 Grams",        price: 6000 },
  {
    imageNo: 141, name: "Brass Krishna Tall", categoryKey: "ROYAL_BRASS",
    dimensions: '1.5"×2"×7.5"', weight: "450 Grams", price: 8100,
    extraSizes: [
      { dimensions: '2"×2.75"×9.5"',  weight: "670 Grams",        price: 12000 },
      { dimensions: '2.5"×3"×11.5"',  weight: "1.200 Kilograms",  price: 21600 },
    ],
  },
  {
    imageNo: 142, name: "Brass Radha", categoryKey: "ROYAL_BRASS",
    dimensions: '1.5"×2"×7.5"', weight: "400 Grams", price: 7200,
    extraSizes: [
      { dimensions: '2"×2.75"×9.5"',  weight: "670 Grams",  price: 12000 },
      { dimensions: '2.5"×3"×11.5"',  weight: "900 Grams",  price: 16200 },
    ],
  },

  // ── Vehicles ───────────────────────────────────────────────────────────────
  { imageNo: 4,  name: "Brass Chariot",            categoryKey: "VEHICLES", dimensions: '2.75"×4.5"×3"',      weight: "420 Grams",  price: 2100 },
  { imageNo: 5,  name: "Brass Bullock Cart",        categoryKey: "VEHICLES", dimensions: '2.5"×4.5"×2"',       weight: "330 Grams",  price: 1650 },
  { imageNo: 6,  name: "Brass Horse Cart",          categoryKey: "VEHICLES", dimensions: '2.75"×8"×4"',        weight: "820 Grams",  price: 4100 },
  { imageNo: 7,  name: "Brass Vintage Car",         categoryKey: "VEHICLES", dimensions: '2.25"×4.5"×2.25"',   weight: "550 Grams",  price: 2750 },
  { imageNo: 8,  name: "Brass Bullock Cart Large",  categoryKey: "VEHICLES", dimensions: '2.5"×5"×2.5"',       weight: "350 Grams",  price: 1750 },

  // ── Wall Hanging ───────────────────────────────────────────────────────────
  {
    imageNo: 12, name: "Brass Om Wall Hanging", categoryKey: "WALL_HANGING",
    dimensions: '4"×4"', weight: "080 Grams", price: 400,
    extraSizes: [
      { dimensions: '6"×6"', weight: "150 Grams", price: 750  },
      { dimensions: '7"×7"', weight: "280 Grams", price: 1400 },
    ],
  },
  {
    imageNo: 13, name: "Brass Swastik Wall Hanging", categoryKey: "WALL_HANGING",
    dimensions: '3"×3.5"', weight: "070 Grams", price: 350,
    extraSizes: [
      { dimensions: '4.5"×3.5"', weight: "150 Grams", price: 750  },
      { dimensions: '5.5"×4.5"', weight: "180 Grams", price: 900  },
      { dimensions: '7"×5.5"',   weight: "300 Grams", price: 1500 },
    ],
  },
  { imageNo: 14,  name: "Brass Hanuman Wall Hanging",       categoryKey: "WALL_HANGING", dimensions: '6"×7"×0.5"',        weight: "750 Grams",        price: 3750  },
  { imageNo: 15,  name: "Brass Lotus Wall Hanging",         categoryKey: "WALL_HANGING", dimensions: '5"×6.25"×1"',       weight: "800 Grams",        price: 4000  },
  { imageNo: 16,  name: "Brass Elephants Wall Hanging",     categoryKey: "WALL_HANGING", dimensions: '3.5"×5"',           weight: "550 Grams",        price: 2750  },
  { imageNo: 17,  name: "Brass Kalash Wall Hanging",        categoryKey: "WALL_HANGING", dimensions: '8"×5.5"',           weight: "920 Grams",        price: 4600  },
  { imageNo: 18,  name: "Brass Cow-Calf Wall Hanging",      categoryKey: "WALL_HANGING", dimensions: '5.5"×7.5"',         weight: "1.000 Kilograms",  price: 5000  },
  { imageNo: 19,  name: "Brass Kalash",                     categoryKey: "WALL_HANGING", dimensions: '7.5"×4"',           weight: "450 Grams",        price: 2250  },
  { imageNo: 24,  name: "Brass Buddha Wall Hanging Large",  categoryKey: "WALL_HANGING", dimensions: '15.5"×10"×2.5"',    weight: "4.750 Kilograms",  price: 23750 },
  { imageNo: 44,  name: "Brass Balaji Wall Hanging",        categoryKey: "WALL_HANGING", dimensions: '16"×12"×3"',        weight: "3.300 Kilograms",  price: 16500 },
  { imageNo: 45,  name: "Brass Tree Wall Hanging",          categoryKey: "WALL_HANGING", dimensions: '14"×13"×1"',        weight: "2.700 Kilograms",  price: 13500 },
  { imageNo: 48,  name: "Brass Peacock Wall Hanging",       categoryKey: "WALL_HANGING", dimensions: '9"×9"',             weight: "950 Grams",        price: 4750  },
  { imageNo: 86,  name: "Brass Buddha Wall Hanging",        categoryKey: "WALL_HANGING", dimensions: '8.5"×6.5"×3"',      weight: "1.600 Kilograms",  price: 7200  },
  { imageNo: 87,  name: "Brass Krishna Wall Hanging",       categoryKey: "WALL_HANGING", dimensions: '11"×6"×2"',         weight: "2.000 Kilograms",  price: 8000  },
  { imageNo: 88,  name: "Brass Om Ganesha Hanging",         categoryKey: "WALL_HANGING", dimensions: '8"×8.5"×0.5"',      weight: "1.350 Kilograms",  price: 6750  },
  { imageNo: 89,  name: "Brass Kalash Wall Hanging Large",  categoryKey: "WALL_HANGING", dimensions: '7.5"×6"×2"',        weight: "1.5 Kilograms",    price: 7500  },
  { imageNo: 103, name: "Brass Sun-Moon Wall Hanging",      categoryKey: "WALL_HANGING", dimensions: '6"×5"',             weight: "700 Grams",        price: 4000  },
  { imageNo: 123, name: "Brass Hanging Lamp",               categoryKey: "WALL_HANGING", dimensions: '4.5"×12"×4"',       weight: "730 Grams",        price: 3200  },
  { imageNo: 124, name: "Brass Hanging Lamp",               categoryKey: "WALL_HANGING", dimensions: '4"×8"×3"',          weight: "550 Grams",        price: 2500  },
  { imageNo: 133, name: "Brass Ashtalakshmi Wall Hanging",  categoryKey: "WALL_HANGING", dimensions: '11.5"×10"×1"',      weight: "2.100 Kilograms",  price: 10500 },
  { imageNo: 152, name: "Brass Swastik Wall Hanging",       categoryKey: "WALL_HANGING", dimensions: '5"×5"',             weight: "250 Grams",        price: 1300  },

  // ── Ganesha ────────────────────────────────────────────────────────────────
  { imageNo: 20,  name: "Brass Ganesha Large",  categoryKey: "GANESHA", dimensions: '4"×7"×8.5"',   weight: "3.000 Kilograms", price: 6000  },
  { imageNo: 22,  name: "Brass Swing Ganesha",  categoryKey: "GANESHA", dimensions: '3"×6"×9.5"',   weight: "1.800 Kilograms", price: 9000  },
  { imageNo: 145, name: "Brass Ganesha",        categoryKey: "GANESHA", dimensions: '6"×8.5"×12"',  weight: "7.500 Kilograms", price: 44000 },

  // ── Buddha ─────────────────────────────────────────────────────────────────
  { imageNo: 21,  name: "Brass Buddha",         categoryKey: "BUDDHA",  dimensions: '5.5"×9"×12"',  weight: "5.700 Kilograms", price: 10250 },

  // ── Urli ───────────────────────────────────────────────────────────────────
  { imageNo: 25,  name: "Brass Urli",         categoryKey: "URLI", dimensions: '8"×6"×6"',     weight: "1.2 Kilograms",    price: 6000  },
  { imageNo: 56,  name: "Brass Ganesha Urli", categoryKey: "URLI", dimensions: undefined,        weight: "2.500 Kilograms",  price: 11250 },
  { imageNo: 104, name: "Brass Urli",         categoryKey: "URLI", dimensions: '9"×9"×1.75"',  weight: "1.650 Kilograms",  price: 7250  },
  { imageNo: 105, name: "Brass Urli",         categoryKey: "URLI", dimensions: '9"×9"×1.5"',   weight: "1.250 Kilograms",  price: 5500  },
  { imageNo: 106, name: "Brass Urli",         categoryKey: "URLI", dimensions: '8"×8"×1.5"',   weight: "1.350 Kilograms",  price: 5700  },
  { imageNo: 127, name: "Brass Urli",         categoryKey: "URLI", dimensions: '7"×7"×9"',     weight: "1.500 Kilograms",  price: 6800  },

  // ── Lakshmi ────────────────────────────────────────────────────────────────
  { imageNo: 26,  name: "Brass Lakshmi Standing", categoryKey: "LAKSHMI", dimensions: '4.5"×6"×12"', weight: "4.000 Kilograms", price: 8000 },
  { imageNo: 55,  name: "Brass Lakshmi Seated",   categoryKey: "LAKSHMI", dimensions: '4"×4"×5"',    weight: "1.300 Kilograms", price: 6500 },

  // ── Balaji ─────────────────────────────────────────────────────────────────
  { imageNo: 42,  name: "Brass Balaji", categoryKey: "BALAJI", dimensions: '2.5"×2"×9.5"',   weight: "1.450 Kilograms", price: 7250  },
  { imageNo: 129, name: "Brass Balaji", categoryKey: "BALAJI", dimensions: '5"×2.5"×10.5"',  weight: "2.450 Kilograms", price: 12250 },
  { imageNo: 139, name: "Brass Balaji", categoryKey: "BALAJI", dimensions: '3"×9.5"×9"',     weight: "2.500 Kilograms", price: 12500 },

  // ── Annapoorna ─────────────────────────────────────────────────────────────
  { imageNo: 43,  name: "Brass Annapoorna Devi",  categoryKey: "ANNAPOORNA", dimensions: '6.5"×5"×10"', weight: "4.150 Kilograms", price: 20750 },

  // ── Natraj ─────────────────────────────────────────────────────────────────
  { imageNo: 49,  name: "Brass Natraj",           categoryKey: "NATRAJ",     dimensions: '5"×2.5"×6.5"',    weight: "720 Grams",       price: 3800  },

  // ── Parvati ────────────────────────────────────────────────────────────────
  { imageNo: 51,  name: "Brass Parvati",          categoryKey: "PARVATI",    dimensions: '5.75"×5.5"×9.5"', weight: "2.850 Kilograms", price: 12800 },

  // ── Krishna ────────────────────────────────────────────────────────────────
  { imageNo: 53,  name: "Brass Krishna",          categoryKey: "KRISHNA", dimensions: '3.5"×2.75"×7"',  weight: "950 Grams",       price: 4750  },
  { imageNo: 61,  name: "Brass Cow Krishna",      categoryKey: "KRISHNA", dimensions: '3.5"×5.5"×7.5"', weight: "2.250 Kilograms", price: 11250 },
  { imageNo: 136, name: "Brass Krishna Tall",     categoryKey: "KRISHNA", dimensions: '3"×5"×9"',        weight: "1.650 Kilograms", price: 8250  },
  { imageNo: 148, name: "Brass Krishna",          categoryKey: "KRISHNA", dimensions: '4"×4"×12"',       weight: "2.750 Kilograms", price: 14000 },

  // ── Saraswati ──────────────────────────────────────────────────────────────
  { imageNo: 54,  name: "Brass Saraswati", categoryKey: "SARASWATI", dimensions: '4"×4"×5"', weight: "1.250 Kilograms", price: 6250 },
  { imageNo: 131, name: "Brass Saraswati", categoryKey: "SARASWATI", dimensions: '3"×3"×5"', weight: "800 Grams",       price: 4800 },

  // ── Lamp ───────────────────────────────────────────────────────────────────
  { imageNo: 50,  name: "Brass Lamp",                  categoryKey: "LAMP", dimensions: '3.5"×5"×7.5"',    weight: "650 Grams",        price: 3250 },
  { imageNo: 52,  name: "Brass Peacock Lamp",          categoryKey: "LAMP", dimensions: '3.25"×3.25"×5"',  weight: "500 Grams",        price: 2000 },
  { imageNo: 57,  name: "Brass Ganesha Lamp",          categoryKey: "LAMP", dimensions: '5.5"×5"×7"',      weight: "1.200 Kilograms",  price: 4800 },
  { imageNo: 58,  name: "Brass Lakshmi Lamp Tall",     categoryKey: "LAMP", dimensions: '6"×6"×11"',        weight: "2.150 Kilograms",  price: 8600 },
  { imageNo: 63,  name: "Brass Lakshmi Lamp",          categoryKey: "LAMP", dimensions: '2.25"×2.25"×3.5"', weight: "130 Grams",        price: 2340 },
  { imageNo: 64,  name: "Brass Lakshmi Lamp Compact",  categoryKey: "LAMP", dimensions: '2.25"×2.5"×3"',    weight: "90 Grams",         price: 1620 },
  { imageNo: 67,  name: "Brass Lakshmi Lamp Pillar",   categoryKey: "LAMP", dimensions: '2.5"×2.25"×4.5"',  weight: "120 Grams",        price: 2160 },
  {
    imageNo: 69, name: "Brass Tortoise Lamp", categoryKey: "LAMP",
    dimensions: '2"×1.25"×1.25"', weight: "35 Grams", price: 630,
    extraSizes: [
      { dimensions: '2.25"×1.75"×1.5"', weight: "60 Grams", price: 1080 },
    ],
  },
  { imageNo: 72,  name: "Brass Peacock Lamp Mini",     categoryKey: "LAMP", dimensions: '3"×3"×5.5"',       weight: "80 Grams",         price: 1440 },
  { imageNo: 73,  name: "Brass Elephant Lamp",         categoryKey: "LAMP", dimensions: '2.5"×2.5"×3"',     weight: "130 Grams",        price: 2340 },
  { imageNo: 75,  name: "Brass Lamp Plain",            categoryKey: "LAMP", dimensions: '2.5"×2.25"×1.5"',  weight: "90 Grams",         price: 1620 },
  { imageNo: 76,  name: "Brass Shankh Chakra Lamp",   categoryKey: "LAMP", dimensions: '2.5"×2.5"×4"',     weight: "110 Grams",        price: 1980 },
  { imageNo: 77,  name: "Brass Lakshmi Lamp Ornate",  categoryKey: "LAMP", dimensions: '3"×2.25"×3.5"',    weight: "110 Grams",        price: 1980 },
  { imageNo: 78,  name: "Brass Lakshmi Balaji Lamp",  categoryKey: "LAMP", dimensions: '3.5"×3"×5.5"',     weight: "200 Grams",        price: 3600 },
  { imageNo: 83,  name: "Brass Swastik Lamp",         categoryKey: "LAMP", dimensions: '2.5"×2.5"×1.5"',   weight: "70 Grams",         price: 1260 },
  { imageNo: 84,  name: "Brass Peacock Lamp Medium",  categoryKey: "LAMP", dimensions: '2.5"×2.5"×5"',     weight: "160 Grams",        price: 2880 },
  {
    imageNo: 85, name: "Brass Ashtalakshmi Lamp", categoryKey: "LAMP",
    dimensions: '3"×3"×5.5"', weight: "150 Grams", price: 2700,
    extraSizes: [
      { dimensions: '5"×5"×7.5"', weight: "350 Grams", price: 6300 },
    ],
  },
  { imageNo: 90,  name: "Brass Lamp",                  categoryKey: "LAMP", dimensions: '4"×3.5"×3"',       weight: "650 Grams",        price: 3380 },
  { imageNo: 91,  name: "Brass Peacock Lamp Slender",  categoryKey: "LAMP", dimensions: '4.5"×1.5"×3.25"',  weight: "110 Grams",        price: 1760 },
  { imageNo: 93,  name: "Brass Ganesha Lamp Round",   categoryKey: "LAMP", dimensions: '3.25"×3"×5.5"',    weight: "200 Grams",        price: 3600 },
  { imageNo: 94,  name: "Brass Lakshmi Lamp Round",   categoryKey: "LAMP", dimensions: '3.25"×3"×5.5"',    weight: "200 Grams",        price: 3600 },
  { imageNo: 95,  name: "Brass Balaji Lamp",          categoryKey: "LAMP", dimensions: '2"×1"×3.5"',       weight: "70 Grams",         price: 1260 },
  { imageNo: 122, name: "Brass Peacock Lamp",         categoryKey: "LAMP", dimensions: '2"×2"×3"',         weight: "130 Grams",        price: 1400 },
  { imageNo: 125, name: "Brass Shankh Chakra Lamp",  categoryKey: "LAMP", dimensions: '5"×4.5"×6"',       weight: "1.800 Kilograms",  price: 9000 },
  { imageNo: 135, name: "Brass Peacock Lamp Large",  categoryKey: "LAMP", dimensions: '9"×4.5"×7.5"',     weight: "1.700 Kilograms",  price: 8500 },
  { imageNo: 151, name: "Brass Ashtalakshmi Lamp",   categoryKey: "LAMP", dimensions: '4"×3.5"×5"',       weight: "600 Grams",        price: 2750 },
  { imageNo: 156, name: "Peacock Lamp",               categoryKey: "LAMP", dimensions: '3.5"×3.5"×5"',     weight: "500 Grams",        price: 3000 },

  // ── Tree ───────────────────────────────────────────────────────────────────
  { imageNo: 59,  name: "Brass Tree",                 categoryKey: "TREE",         dimensions: '2.5"×7.5"×8.5"',   weight: "1.200 Kilograms",  price: 5400  },

  // ── Cow & Calf (small figurines) ───────────────────────────────────────────
  { imageNo: 65,  name: "Brass Cow-Calf Small",       categoryKey: "COW_CALF",     dimensions: '1"×2"×1.5"',       weight: "40 Grams",         price: 720   },
  {
    imageNo: 66, name: "Brass Cow-Calf", categoryKey: "COW_CALF",
    dimensions: '1.75"×2.75"×2.25"', weight: "120 Grams", price: 2160,
    extraSizes: [
      { dimensions: '2.5"×3.5"×3"', weight: "230 Grams", price: 4140 },
    ],
  },

  // ── Cow and Calf (larger / premium) ───────────────────────────────────────
  { imageNo: 96,  name: "Brass Cow-Calf Premium",     categoryKey: "COW_AND_CALF", dimensions: '4"×7"×5"',         weight: "2.45 Kilograms",   price: 12250 },
  {
    imageNo: 97, name: "Brass Cow-Calf Duo", categoryKey: "COW_AND_CALF",
    dimensions: '3.5"×5"×3.5"', weight: "1.100 Kilograms", price: 5500,
    extraSizes: [
      { dimensions: '4.5"×6"×4.5"', weight: "2.000 Kilograms", price: 10000 },
    ],
  },
  { imageNo: 98,  name: "Brass Cow and Calf",         categoryKey: "COW_AND_CALF", dimensions: '3.5"×5"×3.5"',     weight: "1.100 Kilograms",  price: 5500  },
  { imageNo: 99,  name: "Brass Cow and Calf Large",   categoryKey: "COW_AND_CALF", dimensions: '3"×5"×5"',         weight: "2.100 Kilograms",  price: 10500 },
  { imageNo: 134, name: "Brass Cow and Calf XL",      categoryKey: "COW_AND_CALF", dimensions: '4.5"×8"×6.5"',     weight: "3.750 Kilograms",  price: 18750 },
  { imageNo: 147, name: "Brass Cow and Calf",         categoryKey: "COW_AND_CALF", dimensions: '12"×7"×8"',         weight: "7.000 Kilograms",  price: 32000 },
  { imageNo: 149, name: "Brass Cow and Calf",         categoryKey: "COW_AND_CALF", dimensions: '3"×5"×3.5"',        weight: "850 Grams",        price: 3900  },
  { imageNo: 153, name: "Brass Cow and Calf",         categoryKey: "COW_AND_CALF", dimensions: '7"×10"×9.5"',       weight: "8.400 Kilograms",  price: 44000 },

  // ── Raghavendra ────────────────────────────────────────────────────────────
  {
    imageNo: 92, name: "Brass Raghavendra", categoryKey: "RAGHAVENDRA",
    dimensions: '0.75"×1.5"×2.25"', weight: "200 Grams", price: 1000,
    extraSizes: [
      { dimensions: '2"×2.5"×4"',      weight: "750 Grams",       price: 3750 },
      { dimensions: '1.75"×4.5"×5.5"', weight: "1.300 Kilograms", price: 6500 },
    ],
  },

  // ── Lalitha Devi ───────────────────────────────────────────────────────────
  { imageNo: 47,  name: "Brass Lalitha Devi",         categoryKey: "LALITHA_DEVI", dimensions: '7"×6.5"×10"',      weight: "5.000 Kilograms",  price: 25000 },

  // ── Ram ────────────────────────────────────────────────────────────────────
  { imageNo: 128, name: "Brass Ram Darbar Set",       categoryKey: "RAM",          dimensions: '7"×3"×9"',          weight: "2.900 Kilograms",  price: 14500 },

  // ── Varahi ─────────────────────────────────────────────────────────────────
  { imageNo: 143, name: "Brass Varahi",               categoryKey: "VARAHI",       dimensions: '11"×10"×16"',       weight: "15.600 Kilograms", price: 78000 },

  // ── Hanuman ────────────────────────────────────────────────────────────────
  { imageNo: 144, name: "Brass Hanuman",              categoryKey: "HANUMAN",      dimensions: '5"×7.5"×11.5"',     weight: "5.700 Kilograms",  price: 30000 },

  // ── Decor ──────────────────────────────────────────────────────────────────
  { imageNo: 101, name: "Brass Peacock",              categoryKey: "DECOR", dimensions: '8"×3"×6.5"',        weight: "1.300 Kilograms",  price: 7000  },
  { imageNo: 102, name: "Brass Peacock",              categoryKey: "DECOR", dimensions: '9"×4.5"×6.5"',      weight: "2.000 Kilograms",  price: 10000 },
  { imageNo: 132, name: "Brass Peacock",              categoryKey: "DECOR", dimensions: '6"×2"×3"',           weight: "160 Grams",        price: 2880  },
  { imageNo: 138, name: "Brass Varahi Head",          categoryKey: "DECOR", dimensions: '7"×11"×9.5"',        weight: "4.000 Kilograms",  price: 20000 },
  { imageNo: 140, name: "Brass Ganesha Lakshmi Kalash", categoryKey: "DECOR", dimensions: '5"×5"×7"',        weight: "2.400 Kilograms",  price: 12000 },
  { imageNo: 146, name: "Brass Gowri",               categoryKey: "DECOR", dimensions: '4.5"×4"×6.5"',       weight: "1.900 Kilograms",  price: 9500  },
  { imageNo: 150, name: "Brass Tribal Set",           categoryKey: "DECOR", dimensions: '1.75"×1.75"×7.25"',  weight: "2.150 Kilograms",  price: 10000 },
  { imageNo: 155, name: "Brass Dhoop Dhani",         categoryKey: "DECOR", dimensions: '2.25"×5.5"×2.5"',    weight: "500 Grams",        price: 2500  },
  { imageNo: 157, name: "Brass Shank With Stand",    categoryKey: "DECOR", dimensions: '5"×14"×9"',           weight: "3.500 Kilograms",  price: 16000 },
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
    // Deduplicate slugs within this run
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
        category: { connect: { id: CAT[raw.categoryKey] } },
        price: raw.price,
        weightKg: parseWeightKg(raw.weight),
        dimensions: raw.dimensions ?? null,
        description: lines.join(" "),
      },
      create: {
        name: raw.name,
        slug,
        category: { connect: { id: CAT[raw.categoryKey] } },
        description: lines.join(" "),
        price: raw.price,
        stock: 10,
        weightKg: parseWeightKg(raw.weight),
        dimensions: raw.dimensions ?? null,
        isActive: true,
      },
    });

    // Sync SizeVariants — wipe & recreate so data stays in sync with this file
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
      console.log(`   ✔ #${raw.imageNo} ${raw.name} (₹${raw.price.toLocaleString("en-IN")}) + ${raw.extraSizes.length} variant(s)`);
    } else {
      console.log(`   ✔ #${raw.imageNo} ${raw.name} (₹${raw.price.toLocaleString("en-IN")})`);
    }
  }

  console.log("\n✅  Done.\n");
}