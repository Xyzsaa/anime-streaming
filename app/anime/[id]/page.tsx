import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createSupabaseClientInstance } from "@/lib/supabase-server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"

export const revalidate = 0

async function getAnime(id: string) {
  const supabase = createSupabaseClientInstance()

  const { data: anime, error } = await supabase.from("anime").select("*").eq("id", id).single()

  if (error || !anime) {
    return null
  }

  return anime
}

async function getAnimeGenres(id: string) {
  const supabase = createSupabaseClientInstance()

  const { data, error } = await supabase.from("anime_genre").select("genre_id, genre(id, name)").eq("anime_id", id)

  if (error) {
    return []
  }

  return data
}

async function getAnimeEpisodes(id: string) {
  const supabase = createSupabaseClientInstance()

  const { data, error } = await supabase
    .from("episode")
    .select("*")
    .eq("anime_id", id)
    .order("episode_number", { ascending: true })

  if (error) {
    return []
  }

  return data
}

export default async function AnimePage({ params }: { params: { id: string } }) {
  const anime = await getAnime(params.id)

  if (!anime) {
    notFound()
  }

  const genres = await getAnimeGenres(params.id)
  const episodes = await getAnimeEpisodes(params.id)

  return (
    <DashboardShell>
      <DashboardHeader heading={anime.title} text="Anime details">
        <Link href="/anime">
          <Button variant="outline">Back to List</Button>
        </Link>
      </DashboardHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Card>
            <CardContent className="p-0 overflow-hidden">
              {anime.image_url ? (
                <div className="aspect-[2/3] relative">
                  <Image src={anime.image_url || "/placeholder.svg"} alt={anime.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="aspect-[2/3] bg-muted flex items-center justify-center">No Image</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                  <p>{anime.type || "Unknown"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <p>{anime.status || "Unknown"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Rating</h4>
                  <p>{anime.rating || "N/A"}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {genres.length > 0 ? (
                    genres.map((genre) => (
                      <Badge key={genre.genre_id} variant="secondary">
                        {genre.genre.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No genres available</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                <p className="text-sm">{anime.description || "No description available"}</p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="episodes">
            <TabsList>
              <TabsTrigger value="episodes">Episodes ({episodes.length})</TabsTrigger>
              <TabsTrigger value="characters">Characters</TabsTrigger>
            </TabsList>
            <TabsContent value="episodes" className="space-y-4">
              {episodes.length > 0 ? (
                <div className="grid gap-2">
                  {episodes.map((episode) => (
                    <Card key={episode.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Episode {episode.episode_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            {episode.title || `Episode ${episode.episode_number}`}
                          </p>
                        </div>
                        <Link href={`/anime/${anime.id}/episode/${episode.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-center text-muted-foreground py-8">No episodes available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="characters">
              <Card>
                <CardContent className="p-4">
                  <p className="text-center text-muted-foreground py-8">Character information coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardShell>
  )
}
