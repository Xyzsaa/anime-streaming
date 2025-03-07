import { notFound } from "next/navigation"
import Link from "next/link"
import { createSupabaseClientInstance } from "@/lib/supabase-server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { VideoPlayer } from "@/components/video-player"
import { ChevronLeft, ChevronRight } from "lucide-react"

export const revalidate = 0

async function getEpisode(id: string) {
  const supabase = createSupabaseClientInstance()

  const { data: episode, error } = await supabase
    .from("episode")
    .select("*, anime:anime_id(id, title)")
    .eq("id", id)
    .single()

  if (error || !episode) {
    return null
  }

  return episode
}

async function getVideoServers(episodeId: string) {
  const supabase = createSupabaseClientInstance()

  const { data, error } = await supabase
    .from("video_server")
    .select("*, quality:quality_id(id, name)")
    .eq("episode_id", episodeId)
    .order("quality_id", { ascending: true })

  if (error) {
    console.error("Error fetching video servers:", error)
    return []
  }

  return data
}

async function getAdjacentEpisodes(animeId: string, episodeNumber: number) {
  const supabase = createSupabaseClientInstance()

  // Get previous episode
  const { data: prevEpisode } = await supabase
    .from("episode")
    .select("id, episode_number")
    .eq("anime_id", animeId)
    .eq("episode_number", episodeNumber - 1)
    .single()

  // Get next episode
  const { data: nextEpisode } = await supabase
    .from("episode")
    .select("id, episode_number")
    .eq("anime_id", animeId)
    .eq("episode_number", episodeNumber + 1)
    .single()

  return { prevEpisode, nextEpisode }
}

export default async function EpisodePage({ params }: { params: { id: string; episodeId: string } }) {
  const episode = await getEpisode(params.episodeId)

  if (!episode) {
    notFound()
  }

  const videoServers = await getVideoServers(params.episodeId)
  const { prevEpisode, nextEpisode } = await getAdjacentEpisodes(episode.anime_id, episode.episode_number)

  // Group servers by quality
  const serversByQuality = videoServers.reduce((acc: any, server) => {
    const qualityName = server.quality.name
    if (!acc[qualityName]) {
      acc[qualityName] = []
    }
    acc[qualityName].push(server)
    return acc
  }, {})

  // Find default server or use the first one
  const defaultServer = videoServers.find((server) => server.is_default) || videoServers[0]
  const defaultVideoUrl = defaultServer?.url || episode.video_url

  return (
    <DashboardShell>
      <DashboardHeader heading={`${episode.anime.title} - Episode ${episode.episode_number}`} text="Episode details">
        <Link href={`/anime/${params.id}`}>
          <Button variant="outline">Back to Anime</Button>
        </Link>
      </DashboardHeader>

      <Card className="mb-6">
        <CardContent className="p-6">
          <VideoPlayer
            videoUrl={defaultVideoUrl}
            title={`${episode.anime.title} - Episode ${episode.episode_number}`}
            serversByQuality={serversByQuality}
          />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {prevEpisode ? (
          <Link href={`/anime/${params.id}/episode/${prevEpisode.id}`}>
            <Button variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Episode {prevEpisode.episode_number}
            </Button>
          </Link>
        ) : (
          <Button variant="outline" disabled>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous Episode
          </Button>
        )}

        {nextEpisode ? (
          <Link href={`/anime/${params.id}/episode/${nextEpisode.id}`}>
            <Button variant="outline">
              Episode {nextEpisode.episode_number}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" disabled>
            Next Episode
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </DashboardShell>
  )
}
