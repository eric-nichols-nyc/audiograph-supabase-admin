# Simple Artist Chatbot Implementation

## Overview
A straightforward chatbot that queries your existing Supabase artist database without complex AI or vector embeddings.

## Implementation Plan

### 1. Create API Endpoint
Create a new API endpoint at `/app/api/chatbot/route.ts`:

```typescript
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
```

### 2. Create Chat Interface Component

Create a new component at `/components/features/chatbot/chat-interface.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/sonner';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Show loading state
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          data: data
        }]);
      }
    } catch (error) {
      console.error('Error fetching from chatbot API:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response from the chatbot',
        variant: 'destructive',
      });
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error processing your request." 
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Ask me anything about your artists!</p>
            <div className="mt-4 space-y-2">
              <p className="text-sm">Try asking:</p>
              <Button 
                variant="outline" 
                className="text-xs m-1" 
                onClick={() => setInput("Tell me about Lady Gaga")}
              >
                Tell me about Lady Gaga
              </Button>
              <Button 
                variant="outline" 
                className="text-xs m-1" 
                onClick={() => setInput("What are Beyoncé's top songs?")}
              >
                What are Beyoncé's top songs?
              </Button>
              <Button 
                variant="outline" 
                className="text-xs m-1" 
                onClick={() => setInput("Who are similar artists to Drake?")}
              >
                Who are similar artists to Drake?
              </Button>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start max-w-[80%]">
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 mr-2">
                    <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center">
                      🤖
                    </div>
                  </Avatar>
                )}
                <Card className={`p-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <div className="text-sm">{message.content}</div>
                  
                  {message.data?.artist && (
                    <div className="mt-2 pt-2 border-t border-border flex items-center">
                      {message.data.artist.image_url && (
                        <img 
                          src={message.data.artist.image_url} 
                          alt={message.data.artist.name}
                          className="h-8 w-8 rounded-full mr-2"
                        />
                      )}
                      <span className="text-xs font-semibold">{message.data.artist.name}</span>
                    </div>
                  )}
                </Card>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 ml-2">
                    <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center">
                      👤
                    </div>
                  </Avatar>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start">
              <Avatar className="h-8 w-8 mr-2">
                <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center">
                  🤖
                </div>
              </Avatar>
              <Card className="p-3 bg-muted">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about an artist..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
```

### 3. Create Chatbot Page

Create a new page at `/app/chatbot/page.tsx`:

```tsx
import ChatInterface from '@/components/features/chatbot/chat-interface';

export const metadata = {
  title: 'Artist Chatbot | Audiograph',
  description: 'Chat with our AI assistant about your artists',
};

export default function ChatbotPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Artist Chatbot</h1>
      <p className="text-muted-foreground text-center mb-8">
        Ask questions about your artists and get instant answers
      </p>
      
      <ChatInterface />
    </div>
  );
}
```

### 4. Add to Navigation Menu

Update `/config/menu-list.ts` to include the chatbot page.

## How It Works

1. User enters a query like "Give me Lady Gaga's biography"
2. The query parser identifies:
   - Artist name: "Lady Gaga"
   - Information type: "biography"
3. The system queries the database for Lady Gaga's bio
4. The response is formatted and returned to the user

## Limitations

This basic implementation:
- Uses simple pattern matching for query parsing
- Might miss complex queries or ambiguous artist names
- Handles only a limited set of query types
- Doesn't maintain conversation context

## Next Steps

1. Implement the components and API
2. Test with basic queries
3. Refine the query parser based on common patterns
4. Add more query types and formats
5. Consider adding a more sophisticated NLP parser if needed