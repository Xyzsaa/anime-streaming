import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to fetch anime data from Jikan API
async function fetchAnimeData(page = 1, limit = 10) {
  try {
    console.log(`Fetching anime data from page ${page}...`);
    const response = await fetch(`https://api.jikan.moe/v4/anime?page=${page}&limit=${limit}`);
    
    // Jikan API has rate limiting, so we need to check if we're being rate limited
    if (response.status === 429) {
      console.log('Rate limited. Waiting before retrying...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchAnimeData(page, limit);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching anime data:', error);
    return [];
  }
}

// Function to fetch anime genres
async function fetchAnimeGenres(animeId) {
  try {
    console.log(`Fetching genres for anime ID ${animeId}...`);
    const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/full`);
    
    if (response.status === 429) {
      console.log('Rate limited. Waiting before retrying...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchAnimeGenres(animeId);
    }
    
    const data = await response.json();
    return data.data?.genres || [];
  } catch (error) {
    console.error(`Error fetching genres for anime ID ${animeId}:`, error);
    return [];
  }
}

// Function to fetch anime characters
async function fetchAnimeCharacters(animeId) {
  try {
    console.log(`Fetching characters for anime ID ${animeId}...`);
    const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/characters`);
    
    if (response.status === 429) {
      console.log('Rate limited. Waiting before retrying...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchAnimeCharacters(animeId);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching characters for anime ID ${animeId}:`, error);
    return [];
  }
}

// Function to fetch anime episodes
async function fetchAnimeEpisodes(animeId) {
  try {
    console.log(`Fetching episodes for anime ID ${animeId}...`);
    const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/episodes`);
    
    if (response.status === 429) {
      console.log('Rate limited. Waiting before retrying...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchAnimeEpisodes(animeId);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching episodes for anime ID ${animeId}:`, error);
    return [];
  }
}

// Function to insert or update genres in the database
async function insertGenres(genres) {
  const genreIds = [];
  
  for (const genre of genres) {
    // Check if genre already exists
    const { data: existingGenre } = await supabase
      .from('genre')
      .select('id')
      .eq('name', genre.name)
      .single();
    
    if (existingGenre) {
      genreIds.push(existingGenre.id);
    } else {
      // Insert new genre
      const { data: newGenre, error } = await supabase
        .from('genre')
        .insert({ name: genre.name })
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

// Function to insert or update characters in the database
async function insertCharacters(characters) {
  const characterIds = [];
  
  for (const char of characters) {
    const character = char.character;
    
    // Check if character already exists
    const { data: existingCharacter } = await supabase
      .from('character')
      .select('id')
      .eq('name', character.name)
      .single();
    
    if (existingCharacter) {
      characterIds.push(existingCharacter.id);
    } else {
      // Insert new character
      const { data: newCharacter, error } = await supabase
        .from('character')
        .insert({
          name: character.name,
          image_url: character.images?.jpg?.image_url || null,
          description: character.about || null
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error inserting character:', error);
      } else {
        characterIds.push(newCharacter.id);
      }
    }
  }
  
  return characterIds;
}

// Function to insert anime episodes
async function insertEpisodes(animeId, episodes) {
  for (const episode of episodes) {
    const { error } = await supabase
      .from('episode')
      .insert({
        anime_id: animeId,
        episode_number: episode.mal_id,
        title: episode.title,
        air_date: episode.aired ? new Date(episode.aired).toISOString().split('T')[0] : null,
        image_url: null, // Jikan API doesn't provide episode images
        video_url: null  // Jikan API doesn't provide video URLs
      });
    
    if (error) {
      console.error('Error inserting episode:', error);
    }
  }
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

// Function to link anime with characters
async function linkAnimeCharacters(animeId, characterIds) {
  for (const characterId of characterIds) {
    const { error } = await supabase
      .from('anime_character')
      .insert({
        anime_id: animeId,
        character_id: characterId
      });
    
    if (error && !error.message.includes('duplicate key')) {
      console.error('Error linking anime with character:', error);
    }
  }
}

// Main function to fetch and store anime data
async function fetchAndStoreAnimeData() {
  try {
    // Fetch anime data from the first page
    const animeList = await fetchAnimeData(1, 20);
    
    for (const anime of animeList) {
      console.log(`Processing anime: ${anime.title}`);
      
      // Insert or update anime in the database
      const { data: insertedAnime, error } = await supabase
        .from('anime')
        .upsert({
          id: anime.mal_id, // Use the MAL ID as our primary key
          title: anime.title,
          image_url: anime.images?.jpg?.large_image_url || null,
          type: anime.type || null,
          rating: anime.score || null,
          status: anime.status || null,
          description: anime.synopsis || null,
          release_date: anime.aired?.from ? new Date(anime.aired.from).toISOString().split('T')[0] : null
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error inserting anime:', error);
        continue;
      }
      
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch and insert genres
      const genres = await fetchAnimeGenres(anime.mal_id);
      const genreIds = await insertGenres(genres);
      await linkAnimeGenres(insertedAnime.id, genreIds);
      
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch and insert characters
      const characters = await fetchAnimeCharacters(anime.mal_id);
      const characterIds = await insertCharacters(characters);
      await linkAnimeCharacters(insertedAnime.id, characterIds);
      
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch and insert episodes
      const episodes = await fetchAnimeEpisodes(anime.mal_id);
      await insertEpisodes(insertedAnime.id, episodes);
      
      // Wait between processing each anime to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('Anime data fetching and storing completed successfully!');
  } catch (error) {
    console.error('Error in fetchAndStoreAnimeData:', error);
  }
}

// Execute the main function
fetchAndStoreAnimeData();
