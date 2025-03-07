"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle } from "lucide-react"
import { importAnimeData } from "@/lib/import-anime"
import { isSupabaseConfigured } from "@/lib/supabase"

export function ImportDataButton() {
  const [isImporting, setIsImporting] = useState(false)
  const [importCount, setImportCount] = useState(10)
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleImport = async () => {
    try {
      setIsImporting(true)
      setResult(null)

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not properly configured. Please check your environment variables.")
      }

      const result = await importAnimeData(importCount)

      setResult({
        success: true,
        message: `Successfully imported ${result.animeCount} anime with ${result.episodeCount} episodes and ${result.genreCount} genres.`,
      })
    } catch (error) {
      console.error("Import error:", error)
      setResult({
        success: false,
        message: `Error importing data: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Import Data</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Anime Data</DialogTitle>
          <DialogDescription>Import anime data from the API to your Supabase database.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="importCount" className="text-right">
              Count
            </Label>
            <Input
              id="importCount"
              type="number"
              value={importCount}
              onChange={(e) => setImportCount(Number.parseInt(e.target.value) || 10)}
              className="col-span-3"
              min={1}
              max={50}
            />
          </div>
          {!isSupabaseConfigured() && (
            <div className="p-3 rounded-md bg-amber-50 text-amber-800 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Supabase Configuration Missing</p>
                <p className="text-sm">
                  Please check your environment variables and make sure NEXT_PUBLIC_SUPABASE_URL and
                  NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
                </p>
              </div>
            </div>
          )}
          {result && (
            <div
              className={`p-3 rounded-md ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {result.message}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting || !isSupabaseConfigured()}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
