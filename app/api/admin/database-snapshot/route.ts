import { NextRequest, NextResponse } from "next/server"
import { AuthError, requireAdmin } from "@/lib/auth-guards"
import {
  createDatabaseSnapshot,
  parseDatabaseSnapshot,
  restoreDatabaseSnapshot,
} from "@/lib/database-snapshot"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function unauthorisedResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode })
  }
  return NextResponse.json({ error: "Admin access required." }, { status: 403 })
}

export async function GET() {
  try {
    await requireAdmin()
  } catch (error) {
    return unauthorisedResponse(error)
  }

  const snapshot = await createDatabaseSnapshot()
  const date = snapshot.exportedAt.slice(0, 10)

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"jain-metals-backup-${date}.json\"`,
      "Cache-Control": "no-store",
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch (error) {
    return unauthorisedResponse(error)
  }

  try {
    const body = await request.json()
    if (body.confirmation !== "RESTORE") {
      return NextResponse.json({ error: "Type RESTORE to confirm replacing the database." }, { status: 400 })
    }

    const snapshot = parseDatabaseSnapshot(body.snapshot)
    const counts = await restoreDatabaseSnapshot(snapshot)
    return NextResponse.json({ success: true, counts })
  } catch (error) {
    console.error("[database-snapshot] Restore failed", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to restore this snapshot." },
      { status: 400 },
    )
  }
}
