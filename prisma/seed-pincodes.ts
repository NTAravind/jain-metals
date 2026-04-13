import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const BASE_PRICE = 150;
const PRICE_PER_KG = 30;
const FREE_ABOVE = 2500;

interface CSVRow {
  CircleName: string;
  RegionName: string;
  DivisionName: string;
  OfficeName: string;
  Pincode: string;
  OfficeType: string;
  Delivery: string;
  District: string;
  StateName: string;
  Latitude: string;
  Longitude: string;
}

function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.replace(/"/g, "").trim() || "";
    });
    rows.push(row as unknown as CSVRow);
  }

  return rows;
}

async function seedPincodes() {
  console.log("🚀 Starting pincode seed...");

  try {
    const csvPath = path.join(process.cwd(), "CSV", "pincode.csv");

    if (!fs.existsSync(csvPath)) {
      console.error("❌ CSV file not found at:", csvPath);
      return { success: false, error: "CSV file not found" };
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const rows = parseCSV(csvContent);

    console.log(`📊 Found ${rows.length} rows in CSV`);

    const uniquePincodes = new Map<string, CSVRow>();

    for (const row of rows) {
      const pincode = row.Pincode;
      if (pincode && pincode.length === 6 && /^\d{6}$/.test(pincode)) {
        if (!uniquePincodes.has(pincode)) {
          uniquePincodes.set(pincode, row);
        }
      }
    }

    console.log(`📍 Found ${uniquePincodes.size} unique valid pincodes`);

    const pincodeData = Array.from(uniquePincodes.values()).map((row) => ({
      pincode: row.Pincode,
      city: row.District || "",
      state: row.StateName || "",
      basePrice: BASE_PRICE,
      pricePerKg: PRICE_PER_KG,
      freeAboveValue: FREE_ABOVE,
      codAvailable: row.Delivery === "Delivery",
      isActive: row.Delivery === "Delivery",
    }));

    console.log("🗑️ Clearing existing pincodes...");
    await prisma.deliveryPincode.deleteMany({});
    console.log("✅ Cleared existing pincodes");

    const BATCH_SIZE = 1000;
    let processed = 0;

    for (let i = 0; i < pincodeData.length; i += BATCH_SIZE) {
      const batch = pincodeData.slice(i, i + BATCH_SIZE);

      try {
        await prisma.deliveryPincode.createMany({
          data: batch,
          skipDuplicates: true,
        });
        processed += batch.length;
        console.log(`✅ Inserted ${processed}/${pincodeData.length} pincodes`);
      } catch (batchError) {
        console.error(`Error inserting batch starting at ${i}:`, batchError);
      }
    }

    console.log(`✅ Total inserted: ${processed}`);
    console.log("🎉 Pincode seed completed!");
    return { success: true, total: pincodeData.length, processed };
  } catch (error) {
    console.error("❌ Seed error:", error);
    return { success: false, error: String(error) };
  } finally {
    await prisma.$disconnect();
  }
}

seedPincodes()
  .then((result) => {
    console.log("Result:", result);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
