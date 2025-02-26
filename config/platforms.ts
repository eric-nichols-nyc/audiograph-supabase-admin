// Platform configuration with logos and URL patterns
export const platformConfig = {
  spotify: {
    name: 'Spotify',
    logo: '/images/platforms/spotify-logo.png',
    placeholder: 'e.g. 6eUKZXaKkcviH0Ku9w2n3V',
    getUrl: (id: string) => `https://open.spotify.com/artist/${id}`
  },
  youtube: {
    name: 'YouTube',
    logo: '/images/platforms/youtube-logo.png',
    placeholder: 'e.g. UC-9-kyTW8ZkZNDHQJ6FgpwQ or /m/0gjdn4c',
    getUrl: (id: string) => {
      if (id.startsWith('/m/')) {
        return `https://charts.youtube.com/artist/${encodeURIComponent(id)}`;
      }
      return `https://youtube.com/channel/${id}`;
    }
  },
  soundcloud: {
    name: 'SoundCloud',
    logo: '/images/platforms/soundcloud-logo.png',
    placeholder: 'e.g. arianagrande',
    getUrl: (id: string) => `https://soundcloud.com/${id}`
  },
  lastfm: {
    name: 'Last.fm',
    logo: '/images/platforms/lastfm-logo.png',
    placeholder: 'e.g. Ariana+Grande',
    getUrl: (id: string) => `https://www.last.fm/music/${id}`
  },
  musicbrainz: {
    name: 'MusicBrainz',
    logo: '/images/platforms/musicbrainz-logo.png',
    placeholder: 'e.g. 33ab5773-469a-4a13-9f4b-29e92e2a053c',
    getUrl: (id: string) => `https://musicbrainz.org/artist/${id}`
  },
  instagram: {
    name: 'Instagram',
    logo: '/images/platforms/instagram-logo.png',
    placeholder: 'e.g. arianagrande',
    getUrl: (id: string) => `https://instagram.com/${id}`
  },
  facebook: {
    name: 'Facebook',
    logo: '/images/platforms/facebook-logo.png',
    placeholder: 'e.g. arianagrande',
    getUrl: (id: string) => `https://facebook.com/${id}`
  },
  tiktok: {
    name: 'TikTok',
    logo: '/images/platforms/tiktok-logo.png',
    placeholder: 'e.g. arianagrande',
    getUrl: (id: string) => `https://tiktok.com/@${id}`
  },
  wikipedia: {
    name: 'Wikipedia',
    logo: '/images/platforms/wikipedia-logo.png',
    placeholder: 'e.g. Ariana_Grande',
    getUrl: (id: string) => `https://en.wikipedia.org/wiki/${id}`
  },
  songstats: {
    name: 'Songstats',
    logo: '/images/platforms/songstats-logo.png',
    placeholder: 'e.g. 7aot8uey/ariana-grande',
    getUrl: (id: string) => `https://songstats.com/artist/${id}`
  },
  viberate: {
    name: 'Viberate',
    logo: '/images/platforms/viberate-logo.png',
    placeholder: 'e.g. ariana-grande',
    getUrl: (id: string) => `https://www.viberate.com/artist/${id}`
  },
  kworb: {
    name: 'Kworb',
    logo: '/images/platforms/kworb-logo.png',
    placeholder: 'e.g. justinbieber',
    getUrl: (id: string) => `https://kworb.net/youtube/artist/${id}.html`
  }
};

// Type for platform keys
export type PlatformKey = keyof typeof platformConfig;

// Helper function to get URL for a platform
export function getPlatformUrl(platform: string, id: string): string {
  const config = platformConfig[platform as PlatformKey];
  return config?.getUrl(id) || '#';
}

// Get all available platform keys
export function getAllPlatformKeys(): PlatformKey[] {
  return Object.keys(platformConfig) as PlatformKey[];
} 