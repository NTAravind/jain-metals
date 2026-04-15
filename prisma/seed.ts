import { seedAdmin } from "./seed-admin";
import { seedPincodes } from "./seed-pincodes";

async function main() {
  console.log("🎬 Starting master seed...");
  
  try {
    console.log("\n--- Seeding Products & Categories ---");
    await seedAdmin();
    
    console.log("\n--- Seeding Pincodes ---");
    await seedPincodes();
    
    console.log("\n✨ Master seed completed successfully!");
  } catch (error) {
    console.error("\n❌ Master seed failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
