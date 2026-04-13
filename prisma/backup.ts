import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(process.cwd(), "backups");

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log("📦 Starting DB backup...");

    // ─── Fetch all tables ────────────────────────────────────────────────────
    // Add or remove models here to match your schema
    const [
        users,
        categories,
        products,
        orders,
        orderItems,
        addresses,
        coupons,
        otpTokens,
    ] = await Promise.all([
        prisma.user.findMany(),
        prisma.category.findMany(),
        prisma.product.findMany(),
        prisma.order.findMany(),
        prisma.orderItem.findMany(),
        prisma.address.findMany(),
        prisma.coupon.findMany(),
        prisma.oTPToken.findMany(),
    ]);

    const snapshot = {
        exportedAt: new Date().toISOString(),
        tables: {
            users,
            categories,
            products,
            orders,
            orderItems,
            addresses,
            coupons,
            otpTokens,
        },
    };

    const outFile = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2));

    console.log(`✅ Backup saved to ${outFile}`);
    console.table(
        Object.entries(snapshot.tables).map(([table, rows]) => ({
            table,
            rows: (rows as unknown[]).length,
        }))
    );
}

backup()
    .catch((e) => {
        console.error("❌ Backup failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());