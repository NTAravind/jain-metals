import { prisma } from "@/lib/db"

export const SNAPSHOT_FORMAT = "jain-metals/prisma-snapshot"
export const SNAPSHOT_VERSION = 1

export const SNAPSHOT_TABLES = [
  "users",
  "addresses",
  "categories",
  "products",
  "sizeVariants",
  "collections",
  "productCollections",
  "discounts",
  "discountProducts",
  "deliveryPincodes",
  "stateDeliveries",
  "internationalDeliveries",
  "orders",
  "orderItems",
] as const

type SnapshotTable = (typeof SNAPSHOT_TABLES)[number]
type SnapshotTables = Record<SnapshotTable, Record<string, unknown>[]>

export type DatabaseSnapshot = {
  format: typeof SNAPSHOT_FORMAT
  version: typeof SNAPSHOT_VERSION
  exportedAt: string
  tables: SnapshotTables
}

const serialise = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T

export async function createDatabaseSnapshot(): Promise<DatabaseSnapshot> {
  const [
    users,
    addresses,
    categories,
    products,
    sizeVariants,
    collections,
    productCollections,
    discounts,
    discountProducts,
    deliveryPincodes,
    stateDeliveries,
    internationalDeliveries,
    orders,
    orderItems,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.address.findMany(),
    prisma.category.findMany(),
    prisma.product.findMany(),
    prisma.sizeVariant.findMany(),
    prisma.collection.findMany(),
    prisma.productCollection.findMany(),
    prisma.discount.findMany(),
    prisma.discountProduct.findMany(),
    prisma.deliveryPincode.findMany(),
    prisma.stateDelivery.findMany(),
    prisma.internationalDelivery.findMany(),
    prisma.order.findMany(),
    prisma.orderItem.findMany(),
  ])

  return serialise({
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    tables: {
      users,
      addresses,
      categories,
      products,
      sizeVariants,
      collections,
      productCollections,
      discounts,
      discountProducts,
      deliveryPincodes,
      stateDeliveries,
      internationalDeliveries,
      orders,
      orderItems,
    },
  })
}

export function parseDatabaseSnapshot(input: unknown): DatabaseSnapshot {
  if (!input || typeof input !== "object") {
    throw new Error("The uploaded file is not a JSON object.")
  }

  const snapshot = input as Partial<DatabaseSnapshot>
  if (snapshot.format !== SNAPSHOT_FORMAT || snapshot.version !== SNAPSHOT_VERSION) {
    throw new Error("This is not a compatible Jain Metals database snapshot.")
  }
  if (!snapshot.exportedAt || Number.isNaN(Date.parse(snapshot.exportedAt))) {
    throw new Error("The snapshot has an invalid export timestamp.")
  }
  if (!snapshot.tables || typeof snapshot.tables !== "object") {
    throw new Error("The snapshot is missing its table data.")
  }

  for (const table of SNAPSHOT_TABLES) {
    const rows = (snapshot.tables as Partial<SnapshotTables>)[table]
    if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
      throw new Error(`The ${table} table is missing or malformed.`)
    }
  }

  return snapshot as DatabaseSnapshot
}

const createMany = async (data: Record<string, unknown>[], operation: () => unknown) => {
  if (data.length) await operation()
}

/** Replaces every Prisma model in one transaction with a compatible snapshot. */
export async function restoreDatabaseSnapshot(snapshot: DatabaseSnapshot) {
  const { tables } = snapshot

  await prisma.$transaction(async (tx) => {
    // Children must be removed before their required parents.
    await tx.orderItem.deleteMany()
    await tx.order.deleteMany()
    await tx.productCollection.deleteMany()
    await tx.discountProduct.deleteMany()
    await tx.sizeVariant.deleteMany()
    await tx.address.deleteMany()
    await tx.product.deleteMany()
    await tx.collection.deleteMany()
    await tx.discount.deleteMany()
    await tx.category.deleteMany()
    await tx.user.deleteMany()
    await tx.deliveryPincode.deleteMany()
    await tx.stateDelivery.deleteMany()
    await tx.internationalDelivery.deleteMany()

    // Parents are restored first so all original IDs and relations are preserved.
    await createMany(tables.users, () => tx.user.createMany({ data: tables.users as never }))
    await createMany(tables.categories, () => tx.category.createMany({ data: tables.categories as never }))
    await createMany(tables.collections, () => tx.collection.createMany({ data: tables.collections as never }))
    await createMany(tables.discounts, () => tx.discount.createMany({ data: tables.discounts as never }))
    await createMany(tables.deliveryPincodes, () => tx.deliveryPincode.createMany({ data: tables.deliveryPincodes as never }))
    await createMany(tables.stateDeliveries, () => tx.stateDelivery.createMany({ data: tables.stateDeliveries as never }))
    await createMany(tables.internationalDeliveries, () => tx.internationalDelivery.createMany({ data: tables.internationalDeliveries as never }))
    await createMany(tables.products, () => tx.product.createMany({ data: tables.products as never }))
    await createMany(tables.addresses, () => tx.address.createMany({ data: tables.addresses as never }))
    await createMany(tables.sizeVariants, () => tx.sizeVariant.createMany({ data: tables.sizeVariants as never }))
    await createMany(tables.productCollections, () => tx.productCollection.createMany({ data: tables.productCollections as never }))
    await createMany(tables.discountProducts, () => tx.discountProduct.createMany({ data: tables.discountProducts as never }))
    await createMany(tables.orders, () => tx.order.createMany({ data: tables.orders as never }))
    await createMany(tables.orderItems, () => tx.orderItem.createMany({ data: tables.orderItems as never }))
  }, { timeout: 60_000 })

  return Object.fromEntries(SNAPSHOT_TABLES.map((table) => [table, tables[table].length]))
}
