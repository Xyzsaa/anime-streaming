import { createClient } from "@supabase/supabase-js"

export function createSupabaseClientInstance() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase environment variables are missing. Please check your .env file.")
    throw new Error("Supabase environment variables are required")
  }

  return createClient(supabaseUrl, supabaseKey)
}
