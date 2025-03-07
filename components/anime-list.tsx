"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"

type Anime = {
  id: number
  title: string
  image_url: string
  type: string
  status: string
  rating: number
}

export function AnimeList() {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnime() {
      try {
        setLoading(true)
        setError(null)

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
          throw new Error("Supabase is not properly configured. Please check your environment variables.")
        }

        const { data, error } = await supabase.from("anime").select("*").order("id", { ascending: false }).limit(12)

        if (error) {
          throw error
        }

        setAnime(data || [])
      } catch (error) {
        console.error("Error fetching anime:", error)
        setError(error instanceof Error ? error.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchAnime()
  }, [])

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error Loading Anime</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            Please check your environment variables and make sure Supabase is properly configured.
          </p>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-[2/3] relative">
              <Skeleton className="h-full w-full" />
            </div>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (anime.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-xl font-semibold mb-4">No anime found</h3>
        <p className="text-muted-foreground mb-6">Import anime data to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {anime.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <div className="aspect-[2/3] relative">
            {item.image_url ? (
              <Image src={item.image_url || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center">No Image</div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold line-clamp-1">{item.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              {item.type && <span className="text-xs bg-secondary px-2 py-1 rounded">{item.type}</span>}
              {item.status && <span className="text-xs bg-secondary px-2 py-1 rounded">{item.status}</span>}
              {item.rating && <span className="text-xs bg-secondary px-2 py-1 rounded">★ {item.rating}</span>}
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Link href={`/anime/${item.id}`} className="w-full">
              <Button variant="secondary" className="w-full">
                View Details
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
