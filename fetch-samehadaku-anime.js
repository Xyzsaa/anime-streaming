import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Base URL for the API
const BASE_URL = 'https://animeh.lopyubibil.site';

// Function to fetch anime list from home page
async function fetchAnimeList() {
  try {
    console.log('Fetching anime list from home page...');
    const response = await fetch(`${BASE_URL}/samehadaku/home`);
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Failed to fetch anime list: ${data.message}`);
    }
    
    return data.data.recent.animeList || [];
  } catch (error) {
    console.error('Error fetching anime list:', error);
    return [];
  }
}

// Function to fetch anime details
async function fetchAnimeDetails(animeId) {
  try {
    console.log(`Fetching details for anime ID ${animeId}...`);
    const response = await fetch(`${BASE_URL}/samehadaku/anime/${animeId}`);
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Failed to fetch anime details: ${data.message}`);
    }
    
    return data.data;
  } catch (error) {
    console.error(`Error fetching details for anime ID ${animeId}:`, error);
    return null;
  }
}

// Function to fetch episode details
async function fetchEpisodeDetails(episodeId) {
  try {
    console.log(`Fetching details for episode ID ${episodeId}...`);
    const response = await fetch(`${BASE_URL}/samehadaku/episode/${episodeId}`);
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Failed to fetch episode details: ${data.message}`);
    }
    
    return data.data;
  } catch (error) {
    console.error(`Error fetching details for episode ID ${episodeId}:`, error);
    return null;
  }
}

// Function to insert or update genres in the database
async function insertGenres(genreList) {
  const genreIds = [];
  
  for (const genre of genreList) {
    // Check if genre already exists
    const { data: existingGenre } = await supabase
      .from('genre')
      .select('id')
      .eq('name', genre.title)
      .single();
    
    if (existingGenre) {
      genreIds.push(existingGenre.id);
    } else {
      // Insert new genre
      const { data: newGenre, error } = await supabase
        .from('genre')
        .insert({ name: genre.title })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error inserting genre:', error);
      } else {
        genreIds.push(newGenre.id);
      }
    }
  }
  
  return genreIds;
}

// Function to link anime with genres
async function linkAnimeGenres(animeId, genreIds) {
  for (const genreId of genreIds) {
    const { error } = await supabase
      .from('anime_genre')
      .insert({
        anime_id: animeId,
        genre_id: genreId
      });
    
    if (error && !error.message.includes('duplicate key')) {
      console.error('Error linking anime with genre:', error);
    }
  }
}

// Function to insert episodes
async function insertEpisodes(animeId, episodeList) {
  for (const episode of episodeList) {
    // Extract episode number from title (assuming format like "Episode X")
    const episodeNumber = parseInt(episode.title);
    
    if (isNaN(episodeNumber)) {
      console.warn(`Could not parse episode number from: ${episode.title}`);
      continue;
    }
    
    // Fetch episode details to get more information
    const episodeDetails = await fetchEpisodeDetails(episode.episodeId);
    
    if (!episodeDetails) {
      console.warn(`Could not fetch details for episode: ${episode.episodeId}`);
      continue;
    }
    
    // Get video URL from episode details
    const videoUrl = episodeDetails.defaultStreamingUrl || null;
    
    // Insert episode into database
    const { error } = await supabase
      .from('episode')
      .insert({
        anime_id: animeId,
        episode_number: episodeNumber,
        title: `Episode ${episodeNumber}`,
        video_url: videoUrl,
        image_url: episodeDetails.poster || null
      });
    
    if (error) {
      console.error(`Error inserting episode ${episodeNumber}:`, error);
    } else {
      console.log(`Successfully inserted episode ${episodeNumber}`);
    }
    
    // Wait a bit to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Function to parse date string
function parseDate(dateString) {
  if (!dateString) return null;
  
  try {
    // Handle date formats like "Oct 4, 2024 to ?"
    const match = dateString.match(/([A-Za-z]+)\s+(\d+),\s+(\d+)/);
    if (match) {
      const [_, month, day, year] = match;
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const date = new Date(year, monthMap[month], day);
      return date.toISOString().split('T')[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
    return null;
  }
}

// Function to parse rating
function parseRating(ratingString) {
  if (!ratingString) return null;
  
  try {
    // Extract numeric part from rating string like "8.00"
    const rating = parseFloat(ratingString);
    return isNaN(rating) ? null : rating;
  } catch (error) {
    console.error(`Error parsing rating: ${ratingString}`, error);
    return null;
  }
}

// Main function to fetch and store anime data
async function fetchAndStoreAnimeData() {
  try {
    // Fetch anime list from home page
    const animeList = await fetchAnimeList();
    console.log(`Found ${animeList.length} anime to process`);
    
    for (const anime of animeList) {
      console.log(`Processing anime: ${anime.title}`);
      
      // Extract anime ID from the anime object
      const animeId = anime.animeId;
      
      // Fetch detailed information about the anime
      const animeDetails = await fetchAnimeDetails(animeId);
      
      if (!animeDetails) {
        console.warn(`Could not fetch details for anime: ${animeId}`);
        continue;
      }
      
      // Parse rating from score value
      const rating = animeDetails.score ? parseRating(animeDetails.score.value) : null;
      
      // Parse release date
      const releaseDate = parseDate(animeDetails.aired);
      
      // Insert or update anime in the database
      const { data: insertedAnime, error } = await supabase
        .from('anime')
        .upsert({
          title: animeDetails.title,
          image_url: animeDetails.poster,
          type: animeDetails.type || null,
          rating: rating,
          status: animeDetails.status || null,
          description: animeDetails.synopsis?.paragraphs?.join('\n') || null,
          release_date: releaseDate
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error inserting anime:', error);
        continue;
      }
      
      console.log(`Successfully inserted/updated anime with ID: ${insertedAnime.id}`);
      
      // Process genres
      if (animeDetails.genreList && animeDetails.genreList.length > 0) {
        const genreIds = await insertGenres(animeDetails.genreList);
        await linkAnimeGenres(insertedAnime.id, genreIds);
      }
      
      // Process episodes
      if (animeDetails.episodeList && animeDetails.episodeList.length > 0) {
        await insertEpisodes(insertedAnime.id, animeDetails.episodeList);
      }
      
      // Wait between processing each anime to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('Anime data fetching and storing completed successfully!');
  } catch (error) {
    console.error('Error in fetchAndStoreAnimeData:', error);
  }
}

// Execute the main function
fetchAndStoreAnimeData();
