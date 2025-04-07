import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Simple intent parser for artist queries
function parseQuery(query: string) {
  // Normalize and clean query
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check for artist name in query
  let artistName = null;
  // This is a very basic approach - would need refinement
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
    const supabase = createClient();
    const { query } = await req.json();
    
    // Extract intent and entities from query
    const { artistName, infoType } = parseQuery(query);
    
    if (!artistName) {
      return NextResponse.json({ 
        error: "I couldn't identify an artist name in your question." 
      });
    }
    
    // First, find the artist
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, name, slug, bio, image_url')
      .ilike('name', `%${artistName}%`)
      .single();
    
    if (artistError || !artist) {
      return NextResponse.json({ 
        error: `I couldn't find information about ${artistName}.` 
      });
    }
    
    // Based on the info type, fetch the relevant data
    switch (infoType) {
      case 'bio':
        return NextResponse.json({
          response: artist.bio || `I don't have biographical information for ${artist.name}.`,
          artist: { name: artist.name, image_url: artist.image_url }
        });
        
      case 'tracks':
        const { data: tracks } = await supabase
          .from('artist_tracks')
          .select('tracks:track_id(name, spotify_popularity)')
          .eq('artist_id', artist.id)
          .order('tracks(spotify_popularity)', { ascending: false })
          .limit(5);
          
        return NextResponse.json({
          response: tracks?.length 
            ? `Here are the top tracks for ${artist.name}: ${tracks.map(t => t.tracks.name).join(', ')}`
            : `I couldn't find any tracks for ${artist.name}.`,
          artist: { name: artist.name, image_url: artist.image_url },
          tracks: tracks
        });
        
      case 'metrics':
        const { data: metrics } = await supabase
          .from('artist_metrics')
          .select('platform, metric_type, value')
          .eq('artist_id', artist.id)
          .order('date', { ascending: false })
          .limit(10);
          
        return NextResponse.json({
          response: metrics?.length 
            ? `Here are the latest metrics for ${artist.name}: ${metrics.map(m => 
                `${m.platform} ${m.metric_type}: ${m.value.toLocaleString()}`).join(', ')}`
            : `I couldn't find any metrics for ${artist.name}.`,
          artist: { name: artist.name, image_url: artist.image_url },
          metrics: metrics
        });
        
      case 'similar':
        const { data: similar } = await supabase
          .from('similar_artists')
          .select('similar_artist:artist2_id(name, image_url), similarity_score')
          .eq('artist1_id', artist.id)
          .order('similarity_score', { ascending: false })
          .limit(5);
          
        return NextResponse.json({
          response: similar?.length 
            ? `Artists similar to ${artist.name}: ${similar.map(s => s.similar_artist.name).join(', ')}`
            : `I couldn't find any similar artists for ${artist.name}.`,
          artist: { name: artist.name, image_url: artist.image_url },
          similar_artists: similar
        });
        
      default:
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