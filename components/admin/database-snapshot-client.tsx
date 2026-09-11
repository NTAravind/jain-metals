"use client"

import { ChangeEvent, useRef, useState } from "react"
import { Download, FileJson, Loader2, RotateCcw, ShieldAlert, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type SnapshotFile = { name: string; snapshot: unknown }

export function DatabaseSnapshotClient() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [snapshotFile, setSnapshotFile] = useState<SnapshotFile | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")

  const downloadBackup = async () => {
    setDownloadLoading(true)
    try {
      const response = await fetch("/api/admin/database-snapshot", { cache: "no-store" })
      if (!response.ok) throw new Error("Could not create the backup.")

      const blob = await response.blob()
      const href = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = href
      link.download = `jain-metals-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(href)
      toast.success("Database backup downloaded.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the backup.")
    } finally {
      setDownloadLoading(false)
    }
  }

  const selectSnapshot = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setSnapshotFile({ name: file.name, snapshot: JSON.parse(await file.text()) })
      toast.success("Backup file is ready to restore.")
    } catch {
      setSnapshotFile(null)
      toast.error("Choose a valid JSON file.")
    } finally {
      event.target.value = ""
    }
  }

  const restoreBackup = async () => {
    if (!snapshotFile) return
    setRestoreLoading(true)
    try {
      const response = await fetch("/api/admin/database-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: snapshotFile.snapshot, confirmation }),
      })
      const result = await response.json() as { error?: string; counts?: Record<string, number> }
      if (!response.ok) throw new Error(result.error ?? "Could not restore the backup.")

      const total = Object.values(result.counts ?? {}).reduce((sum, count) => sum + count, 0)
      toast.success(`Database restored: ${total} records imported.`)
      setSnapshotFile(null)
      setConfirmation("")
      setConfirmOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not restore the backup.")
    } finally {
      setRestoreLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-black/10 bg-black/[0.02] p-6">
        <div className="flex gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-black text-white"><Download className="size-5" /></div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-black">Download backup</h2>
            <p className="mt-1 text-sm leading-6 text-black/55">Exports every model in the current Prisma schema, including IDs, relations, timestamps, and delivery settings, as a portable JSON snapshot.</p>
            <Button onClick={downloadBackup} disabled={downloadLoading} className="mt-5 h-11 rounded-xl bg-black px-5 font-bold">
              {downloadLoading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Download JSON backup
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/30 bg-amber-50 p-6">
        <div className="flex gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white"><ShieldAlert className="size-5" /></div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-black">Restore a backup</h2>
            <p className="mt-1 text-sm leading-6 text-black/60">Restoring permanently replaces all current database records with the selected snapshot. Upload only backups downloaded from this server page.</p>
            <input ref={inputRef} type="file" accept="application/json,.json" onChange={selectSnapshot} className="hidden" />
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} className="h-11 rounded-xl border-black/15 bg-white px-5 font-bold">
                <Upload className="size-4" /> Select backup file
              </Button>
              {snapshotFile && <span className="inline-flex max-w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black/70"><FileJson className="size-4 shrink-0" /><span className="truncate">{snapshotFile.name}</span></span>}
            </div>
            {snapshotFile && (
              <Button type="button" onClick={() => setConfirmOpen(true)} className="mt-4 h-11 rounded-xl bg-amber-600 px-5 font-bold text-white hover:bg-amber-700">
                <RotateCcw className="size-4" /> Restore this backup
              </Button>
            )}
          </div>
        </div>
      </section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the entire database?</AlertDialogTitle>
            <AlertDialogDescription>This deletes all current records, then restores <strong>{snapshotFile?.name}</strong>. Type <strong>RESTORE</strong> to continue.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="RESTORE" autoComplete="off" />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoreLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={confirmation !== "RESTORE" || restoreLoading} onClick={(event) => { event.preventDefault(); void restoreBackup() }} className="bg-amber-600 text-white hover:bg-amber-700">
              {restoreLoading ? <Loader2 className="size-4 animate-spin" /> : "Replace database"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
