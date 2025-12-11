import { ContentItem } from './types';

export const INITIAL_CONTENT: ContentItem[] = [
  {
    id: '1',
    type: 'movie',
    title: 'Big Buck Bunny',
    description: 'Big Buck Bunny tells the story of a giant rabbit with a heart bigger than himself.',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    categories: ['Comedy', 'Animation'],
    addedAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'movie',
    title: 'Sintel',
    description: 'Sintel is an independently produced short film, initiated by the Blender Foundation.',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Sintel_poster.jpg/800px-Sintel_poster.jpg',
    streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    categories: ['Fantasy', 'Animation'],
    addedAt: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'series',
    title: 'Tears of Steel',
    description: 'A group of warriors and scientists gather at the "Oude Kerk" in Amsterdam to stage a crucial event from the past.',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Tears_of_Steel_poster.jpg/800px-Tears_of_Steel_poster.jpg',
    categories: ['Sci-Fi', 'Action'],
    addedAt: new Date().toISOString(),
    episodes: [
        {
            id: 'e1',
            title: 'The Beginning',
            seasonNumber: 1,
            episodeNumber: 1,
            streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' // Placeholder stream
        },
        {
            id: 'e2',
            title: 'The Conflict',
            seasonNumber: 1,
            episodeNumber: 2,
            streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8' // Placeholder stream
        }
    ]
  }
];

export const STORAGE_KEY = 'eddit_site_db_v2';
export const ADMIN_PASSWORD = 'admin'; // Simple password for demo
