import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { SpotifyService } from '@/services/spotify-service';
import { addFullArtist } from '@/services/add-artist-full';

// Intent parser for artist queries
function parseQuery(query: string) {
  // Normalize and clean query
  const normalizedQuery = query.toLowerCase().trim();

  // Check for artist name in query
  let artistName = null;

  // Check for adding artist patterns first
  if (normalizedQuery.includes('add artist') ||
    normalizedQuery.includes('create artist') ||
    normalizedQuery.includes('new artist')) {

    // Extract artist name after the add/create command
    const addMatches = normalizedQuery.match(/(?:add|create|new)\s+artist\s+([a-z0-9\s&]+)(?:\s|$)/i);
    if (addMatches && addMatches[1]) {
      artistName = addMatches[1].trim();
      return { artistName, infoType: 'add_artist' };
    }
  }

  // Traditional artist name extraction for other queries
  const nameMatches = normalizedQuery.match(/(about|for|on|of|'s)\s+([a-z\s&]+)(\s+|$)/i);
  if (nameMatches && nameMatches[2]) {
    artistName = nameMatches[2].trim();
  }

  // Determine requested information type
  let infoType = 'bio';  // Default to biography

  if (normalizedQuery.includes('bio') || normalizedQuery.includes('about') ||
    normalizedQuery.includes('information') || normalizedQuery.includes('biography')) {
    infoType = 'bio';
  } else if (normalizedQuery.includes('track') || normalizedQuery.includes('song') ||
    normalizedQuery.includes('music')) {
    infoType = 'tracks';
  } else if (normalizedQuery.includes('video')) {
    infoType = 'videos';
  } else if (normalizedQuery.includes('metric') || normalizedQuery.includes('stat') ||
    normalizedQuery.includes('follower') || normalizedQuery.includes('listen')) {
    infoType = 'metrics';
  } else if (normalizedQuery.includes('similar') || normalizedQuery.includes('like')) {
    infoType = 'similar';
  }

  return { artistName, infoType };
}

export async function POST(req: Request) {
  try {
    const supabaseClient = await createClient();
    const { query } = await req.json();

    // Extract intent and entities from query
    const { artistName, infoType } = parseQuery(query);

    if (!artistName) {
      return NextResponse.json({
        error: "I couldn't identify an artist name in your question."
      });
    }

    // First, find the artist
    const { data: artist, error: artistError } = await supabaseClient
      .from('artists')
      .select('id, name, slug, bio, image_url')
      .ilike('name', `%${artistName}%`)
      .single();

    // Special handling for add_artist intent - if artist not found, we'll add them
    if (infoType === 'add_artist') {
      // Continue even if artist not found
    } else if (artistError || !artist) {
      return NextResponse.json({
        error: `I couldn't find information about ${artistName}.`
      });
    }

    // Based on the info type, fetch the relevant data
    switch (infoType) {
      case 'add_artist':
        try {
          // Check if artist already exists in our database first
          if (artist) {
            return NextResponse.json({
              response: `${artist.name} is already in our database!`,
              artist: { name: artist.name, image_url: artist.image_url },
              hasAction: true,
              action: {
                type: 'link',
                text: 'View Artist Page',
                url: `/artists/${artist.slug}`
              }
            });
          }

          // Artist not found, so we need to add them
          // Step 1: Call Spotify API to find the artist
          const spotifyService = new SpotifyService();
          const spotifyArtist = await spotifyService.getArtist(artistName);

          if (!spotifyArtist) {
            return NextResponse.json({
              response: `I couldn't find an artist named "${artistName}" on Spotify. Please check the spelling and try again.`
            });
          }

          // Step 2: Process the Spotify data for our database
          const artistData = {
            artist: {
              name: spotifyArtist.name,
              slug: spotifyArtist.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
              image_url: spotifyArtist.images?.[0]?.url || '',
              bio: '',
              is_complete: false,
              genres: spotifyArtist.genres || null,
              gender: '',
              country: '',
              birth_date: '',
            },
            platformData: [
              {
                platform: 'spotify',
                platform_id: spotifyArtist.id,
              }
            ],
            metricData: [
              {
                platform: 'spotify',
                metric_type: 'followers' as const,
                value: spotifyArtist.followers.total,
                date: new Date().toISOString(),
              }
            ],
            urlData: [],
            tracks: [],
            videos: []
          };

          // Step 3: Add the artist to our database
          const result = await addFullArtist(artistData);

          if (result && 'error' in result) {
            return NextResponse.json({
              response: `I had trouble adding ${artistName} to the database: ${result.error}`
            });
          }

          // Step 4: Return success with a link to the artist page
          console.log("Artist added successfully, returning with action:", {
            name: spotifyArtist.name,
            slug: artistData.artist.slug,
            hasAction: true
          });

          const response = {
            response: `Successfully added ${spotifyArtist.name} to the database!`,
            artist: {
              name: spotifyArtist.name,
              image_url: spotifyArtist.images?.[0]?.url,
              slug: artistData.artist.slug
            },
            hasAction: true,
            action: {
              type: 'link',
              text: 'View Artist Page',
              url: `/artists/${artistData.artist.slug}`
            }
          };

          console.log("Full response:", JSON.stringify(response));
          return NextResponse.json(response);
        } catch (error) {
          console.error('Error adding artist via chatbot:', error);
          return NextResponse.json({
            response: `I encountered an error while trying to add ${artistName}. Please try again later.`
          });
        }

      case 'bio':
        if (!artist) {
          return NextResponse.json({ error: `I couldn't find information about ${artistName}.` });
        }
        return NextResponse.json({
          response: artist.bio || `I don't have biographical information for ${artist.name}.`,
          artist: { name: artist.name, image_url: artist.image_url }
        });

      case 'tracks':
        if (!artist) {
          return NextResponse.json({ error: `I couldn't find information about ${artistName}.` });
        }
        const { data: tracks } = await supabaseClient
          .from('artist_tracks')
          .select('tracks:track_id(name, spotify_popularity)')
          .eq('artist_id', artist.id)
          .order('tracks(spotify_popularity)', { ascending: false })
          .limit(5);

        return NextResponse.json({
          response: tracks?.length
            ? `Here are the top tracks for ${artist.name}: ${tracks.map((t: any) => t.tracks.name).join(', ')}`
            : `I couldn't find any tracks for ${artist.name}.`,
          artist: { name: artist.name, image_url: artist.image_url },
          tracks: tracks
        });

      case 'metrics':
        if (!artist) {
          return NextResponse.json({ error: `I couldn't find information about ${artistName}.` });
        }
        const { data: metrics } = await supabaseClient
          .from('artist_metrics')
          .select('platform, metric_type, value')
          .eq('artist_id', artist.id)
          .order('date', { ascending: false })
          .limit(10);

        return NextResponse.json({
          response: metrics?.length
            ? `Here are the latest metrics for ${artist.name}: ${metrics.map((m: any) =>
              `${m.platform} ${m.metric_type}: ${m.value.toLocaleString()}`).join(', ')}`
            : `I couldn't find any metrics for ${artist.name}.`,
          artist: { name: artist.name, image_url: artist.image_url },
          metrics: metrics
        });

      case 'similar':
        if (!artist) {
          return NextResponse.json({ error: `I couldn't find information about ${artistName}.` });
        }
        const { data: similar } = await supabaseClient
          .from('similar_artists')
          .select('similar_artist:artist2_id(name, image_url), similarity_score')
          .eq('artist1_id', artist.id)
          .order('similarity_score', { ascending: false })
          .limit(5);

        return NextResponse.json({
          response: similar?.length
            ? `Artists similar to ${artist.name}: ${similar.map((s: any) => s.similar_artist.name).join(', ')}`
            : `I couldn't find any similar artists for ${artist.name}.`,
          artist: { name: artist.name, image_url: artist.image_url },
          similar_artists: similar
        });

      default:
        if (!artist) {
          return NextResponse.json({ error: `I couldn't find information about ${artistName}.` });
        }
        return NextResponse.json({
          response: `I found ${artist.name}, but I'm not sure what information you're looking for.`,
          artist: { name: artist.name, image_url: artist.image_url }
        });
    }

  } catch (error) {
    console.error('Chatbot query error:', error);
    return NextResponse.json({ error: "Sorry, I couldn't process your request." });
  }
}