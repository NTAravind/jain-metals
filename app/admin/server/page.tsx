import { DatabaseSnapshotClient } from "@/components/admin/database-snapshot-client"

export default function AdminServerPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tighter text-black">Server backup</h1>
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Database export and restore</p>
      </div>
      <DatabaseSnapshotClient />
    </div>
  )
}
