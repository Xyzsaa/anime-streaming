"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function SupabaseConfigCheck() {
  const [isConfigured, setIsConfigured] = useState(true)

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured())
  }, [])

  if (isConfigured) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Configuration Error</AlertTitle>
      <AlertDescription>
        Supabase environment variables are missing. Please make sure NEXT_PUBLIC_SUPABASE_URL and
        NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment.
      </AlertDescription>
    </Alert>
  )
}
