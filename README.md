# anime-streaming
anime database, dan anime streaming build with next.js

website buat nyimpen data anime dari api [wajik-anime-api](https://github.com/wajik45/wajik-anime-api) buatan dari [wajik](https://github.com/wajik45)

script ini di buat untuk menyimpan data dari api ke supabase(database supabase) dan juga bisa di buat untuk streaming anime juga!
untuk dokumentasi apinya kalian bisa langsung ke [wajik-anime-api](https://github.com/wajik45/wajik-anime-api)


jangan lupa buat file .env.local
```
NEXT_PUBLIC_SUPABASE_URL= url mu wir
NEXT_PUBLIC_SUPABASE_ANON_KEY= url mu wir
```

# sumber api [wajik-anime-api](https://github.com/wajik45/wajik-anime-api)

struktur tabelnya 

```
-- Tabel Anime
CREATE TABLE anime (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT,
    type TEXT,
    rating DECIMAL(3,1),
    status TEXT,
    views INTEGER DEFAULT 0,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    release_date DATE
);

-- Tabel Manga
CREATE TABLE manga (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT,
    type TEXT,
    rating DECIMAL(3,1),
    status TEXT,
    views INTEGER DEFAULT 0,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    release_date DATE
);

-- Tabel Episode
CREATE TABLE episode (
    id SERIAL PRIMARY KEY,
    anime_id INTEGER REFERENCES anime(id),
    episode_number INTEGER,
    title TEXT,
    air_date DATE,
    video_url TEXT,
    image_url TEXT
);

-- Tabel Chapter
CREATE TABLE chapter (
    id SERIAL PRIMARY KEY,
    manga_id INTEGER REFERENCES manga(id),
    chapter_number DECIMAL(8,2),
    title TEXT,
    release_date DATE,
    image_url TEXT
);

-- Tabel Character
CREATE TABLE character (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    description TEXT
);

-- Tabel Anime_Character (untuk menghubungkan anime dengan karakter)
CREATE TABLE anime_character (
    anime_id INTEGER REFERENCES anime(id),
    character_id INTEGER REFERENCES character(id),
    PRIMARY KEY (anime_id, character_id)
);

-- Tabel Manga_Character (untuk menghubungkan manga dengan karakter)
CREATE TABLE manga_character (
    manga_id INTEGER REFERENCES manga(id),
    character_id INTEGER REFERENCES character(id),
    PRIMARY KEY (manga_id, character_id)
);

-- Tabel Genre
CREATE TABLE genre (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- Tabel Anime_Genre (untuk menghubungkan anime dengan genre)
CREATE TABLE anime_genre (
    anime_id INTEGER REFERENCES anime(id),
    genre_id INTEGER REFERENCES genre(id),
    PRIMARY KEY (anime_id, genre_id)
);

-- Tabel Manga_Genre (untuk menghubungkan manga dengan genre)
CREATE TABLE manga_genre (
    manga_id INTEGER REFERENCES manga(id),
    genre_id INTEGER REFERENCES genre(id),
    PRIMARY KEY (manga_id, genre_id)
);

-- Tabel Author
CREATE TABLE author (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    biography TEXT
);

-- Tabel Manga_Author (untuk menghubungkan manga dengan author)
CREATE TABLE manga_author (
    manga_id INTEGER REFERENCES manga(id),
    author_id INTEGER REFERENCES author(id),
    PRIMARY KEY (manga_id, author_id)
);

-- Tabel Anime Schedules
CREATE TABLE anime_schedules (
    id SERIAL PRIMARY KEY,
    anime_id INTEGER REFERENCES anime(id),
    day TEXT,
    time TIME
);

-- Tabel untuk menyimpan kualitas video
CREATE TABLE video_quality (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL -- misalnya "360p", "480p", "720p", "1080p"
);

-- Tabel untuk menyimpan server video
CREATE TABLE video_server (
  id SERIAL PRIMARY KEY,
  episode_id INTEGER REFERENCES episode(id),
  quality_id INTEGER REFERENCES video_quality(id),
  server_name TEXT NOT NULL, -- misalnya "Blogspot", "Premium", "Vidhide"
  url TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  COLUMN server_id TEXT
);
```
