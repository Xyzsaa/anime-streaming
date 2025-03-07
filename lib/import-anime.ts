import { supabase } from "@/lib/supabase"

// Base URL for the API
const BASE_URL = "https://animeh.lopyubibil.site"

// Function to fetch anime list from home page
async function fetchAnimeList() {
  try {
    console.log("Fetching anime list from home page...")
    const response = await fetch(`${BASE_URL}/samehadaku/home`)
    const data = await response.json()

    if (!data.ok) {
      throw new Error(`Failed to fetch anime list: ${data.message}`)
    }

    return data.data.recent.animeList || []
  } catch (error) {
    console.error("Error fetching anime list:", error)
    throw error
  }
}

// Function to fetch anime details
async function fetchAnimeDetails(animeId: string) {
  try {
    console.log(`Fetching details for anime ID ${animeId}...`)
    const response = await fetch(`${BASE_URL}/samehadaku/anime/${animeId}`)
    const data = await response.json()

    if (!data.ok) {
      throw new Error(`Failed to fetch anime details: ${data.message}`)
    }

    return data.data
  } catch (error) {
    console.error(`Error fetching details for anime ID ${animeId}:`, error)
    throw error
  }
}

// Function to fetch episode details
async function fetchEpisodeDetails(episodeId: string) {
  try {
    console.log(`Fetching details for episode ID ${episodeId}...`)
    const response = await fetch(`${BASE_URL}/samehadaku/episode/${episodeId}`)
    const data = await response.json()

    if (!data.ok) {
      throw new Error(`Failed to fetch episode details: ${data.message}`)
    }

    return data.data
  } catch (error) {
    console.error(`Error fetching details for episode ID ${episodeId}:`, error)
    throw error
  }
}

// Function to insert or update genres in the database
async function insertGenres(genreList: any[]) {
  const genreIds = []
  let genreCount = 0

  for (const genre of genreList) {
    // Check if genre already exists
    const { data: existingGenre } = await supabase.from("genre").select("id").eq("name", genre.title).single()

    if (existingGenre) {
      genreIds.push(existingGenre.id)
    } else {
      // Insert new genre
      const { data: newGenre, error } = await supabase.from("genre").insert({ name: genre.title }).select("id").single()

      if (error) {
        console.error("Error inserting genre:", error)
      } else {
        genreIds.push(newGenre.id)
        genreCount++
      }
    }
  }

  return { genreIds, genreCount }
}

// Function to link anime with genres
async function linkAnimeGenres(animeId: number, genreIds: number[]) {
  for (const genreId of genreIds) {
    const { error } = await supabase.from("anime_genre").insert({
      anime_id: animeId,
      genre_id: genreId,
    })

    if (error && !error.message.includes("duplicate key")) {
      console.error("Error linking anime with genre:", error)
    }
  }
}

// Function to fetch server URL
async function fetchServerUrl(serverId: string) {
  try {
    console.log(`Fetching URL for server ID ${serverId}...`)
    const response = await fetch(`${BASE_URL}/samehadaku/server/${serverId}`)
    const data = await response.json()

    if (!data.ok) {
      throw new Error(`Failed to fetch server URL: ${data.message}`)
    }

    return data.data.url || ""
  } catch (error) {
    console.error(`Error fetching URL for server ID ${serverId}:`, error)
    return ""
  }
}

// Function to insert episodes
async function insertEpisodes(animeId: number, episodeList: any[]) {
  let episodeCount = 0
  let serverCount = 0

  for (const episode of episodeList) {
    // Extract episode number from title (assuming format like "Episode X")
    const episodeNumber = Number.parseInt(episode.title)

    if (isNaN(episodeNumber)) {
      console.warn(`Could not parse episode number from: ${episode.title}`)
      continue
    }

    // Fetch episode details to get more information
    try {
      const episodeDetails = await fetchEpisodeDetails(episode.episodeId)

      if (!episodeDetails) {
        console.warn(`Could not fetch details for episode: ${episode.episodeId}`)
        continue
      }

      // Get video URL from episode details
      const videoUrl = episodeDetails.defaultStreamingUrl || null

      // Insert episode into database
      const { data: insertedEpisode, error } = await supabase
        .from("episode")
        .insert({
          anime_id: animeId,
          episode_number: episodeNumber,
          title: `Episode ${episodeNumber}`,
          video_url: videoUrl,
          image_url: episodeDetails.poster || null,
        })
        .select("id")
        .single()

      if (error) {
        console.error(`Error inserting episode ${episodeNumber}:`, error)
        continue
      }

      console.log(`Successfully inserted episode ${episodeNumber}`)
      episodeCount++

      // Insert video servers if available
      if (episodeDetails.server) {
        const newServerCount = await insertVideoServers(insertedEpisode.id, episodeDetails.server)
        serverCount += newServerCount
        console.log(`Added ${newServerCount} servers for episode ${episodeNumber}`)
      }

      // Wait a bit to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Error processing episode ${episode.episodeId}:`, error)
    }
  }

  return { episodeCount, serverCount }
}

// Modifikasi fungsi insertVideoServers untuk mengambil URL sebenarnya
async function insertVideoServers(episodeId: number, serverData: any) {
  let serverCount = 0

  if (!serverData || !serverData.qualities) {
    return serverCount
  }

  // Loop melalui semua kualitas video
  for (const quality of serverData.qualities) {
    // Skip kualitas yang tidak memiliki server
    if (!quality.serverList || quality.serverList.length === 0) {
      continue
    }

    // Cek apakah kualitas sudah ada di database
    const { data: existingQuality } = await supabase
      .from("video_quality")
      .select("id")
      .eq("name", quality.title)
      .single()

    let qualityId

    if (existingQuality) {
      qualityId = existingQuality.id
    } else {
      // Insert kualitas baru
      const { data: newQuality, error } = await supabase
        .from("video_quality")
        .insert({ name: quality.title })
        .select("id")
        .single()

      if (error) {
        console.error("Error inserting video quality:", error)
        continue
      }

      qualityId = newQuality.id
    }

    // Loop melalui semua server untuk kualitas ini
    for (const server of quality.serverList) {
      try {
        // Fetch URL server dari API
        const serverUrl = await fetchServerUrl(server.serverId)

        if (!serverUrl) {
          console.warn(`No URL found for server ${server.title} (ID: ${server.serverId})`)
          continue
        }

        // Insert server ke database
        const { error } = await supabase.from("video_server").insert({
          episode_id: episodeId,
          quality_id: qualityId,
          server_name: server.title,
          url: serverUrl,
          server_id: server.serverId, // Simpan server ID untuk referensi
          is_default: server.title.toLowerCase().includes("default") || false,
        })

        if (error) {
          console.error("Error inserting video server:", error)
        } else {
          serverCount++
          console.log(`Added server ${server.title} with URL: ${serverUrl}`)
        }

        // Tunggu sebentar untuk menghindari rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error processing server ${server.title}:`, error)
      }
    }
  }

  return serverCount
}

// Function to parse date string
function parseDate(dateString: string | null) {
  if (!dateString) return null

  try {
    // Handle date formats like "Oct 4, 2024 to ?"
    const match = dateString.match(/([A-Za-z]+)\s+(\d+),\s+(\d+)/)
    if (match) {
      const [_, month, day, year] = match
      const monthMap: Record<string, number> = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      }

      const date = new Date(Number.parseInt(year), monthMap[month], Number.parseInt(day))
      return date.toISOString().split("T")[0]
    }

    return null
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error)
    return null
  }
}

// Function to parse rating
function parseRating(ratingString: string | null) {
  if (!ratingString) return null

  try {
    // Extract numeric part from rating string like "8.00"
    const rating = Number.parseFloat(ratingString)
    return isNaN(rating) ? null : rating
  } catch (error) {
    console.error(`Error parsing rating: ${ratingString}`, error)
    return null
  }
}

// Main function to import anime data
export async function importAnimeData(limit = 10) {
  try {
    // Fetch anime list from home page
    const animeList = await fetchAnimeList()
    console.log(`Found ${animeList.length} anime to process`)

    // Limit the number of anime to import
    const limitedAnimeList = animeList.slice(0, limit)

    let animeCount = 0
    let totalEpisodeCount = 0
    let totalGenreCount = 0
    let totalServerCount = 0

    for (const anime of limitedAnimeList) {
      console.log(`Processing anime: ${anime.title}`)

      // Extract anime ID from the anime object
      const animeId = anime.animeId

      try {
        // Fetch detailed information about the anime
        const animeDetails = await fetchAnimeDetails(animeId)

        if (!animeDetails) {
          console.warn(`Could not fetch details for anime: ${animeId}`)
          continue
        }

        // Parse rating from score value
        const rating = animeDetails.score ? parseRating(animeDetails.score.value) : null

        // Parse release date
        const releaseDate = parseDate(animeDetails.aired)

        // Insert or update anime in the database
        const { data: insertedAnime, error } = await supabase
          .from("anime")
          .upsert({
            title: animeDetails.title,
            image_url: animeDetails.poster,
            type: animeDetails.type || null,
            rating: rating,
            status: animeDetails.status || null,
            description: animeDetails.synopsis?.paragraphs?.join("\n") || null,
            release_date: releaseDate,
          })
          .select("id")
          .single()

        if (error) {
          console.error("Error inserting anime:", error)
          continue
        }

        console.log(`Successfully inserted/updated anime with ID: ${insertedAnime.id}`)
        animeCount++

        // Process genres
        if (animeDetails.genreList && animeDetails.genreList.length > 0) {
          const { genreIds, genreCount } = await insertGenres(animeDetails.genreList)
          await linkAnimeGenres(insertedAnime.id, genreIds)
          totalGenreCount += genreCount
        }

        // Process episodes
        if (animeDetails.episodeList && animeDetails.episodeList.length > 0) {
          const { episodeCount, serverCount } = await insertEpisodes(insertedAnime.id, animeDetails.episodeList)
          totalEpisodeCount += episodeCount
          totalServerCount += serverCount
        }
      } catch (error) {
        console.error(`Error processing anime ${animeId}:`, error)
      }

      // Wait between processing each anime to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    console.log("Anime data import completed successfully!")
    return {
      animeCount,
      episodeCount: totalEpisodeCount,
      genreCount: totalGenreCount,
      serverCount: totalServerCount,
    }
  } catch (error) {
    console.error("Error in importAnimeData:", error)
    throw error
  }
}
