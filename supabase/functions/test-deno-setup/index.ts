// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Import Supabase Edge Function types
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

console.log("Deno is running!");

serve(async (req) => {
  const { name } = await req.json();
  const message = `Hello ${name || "World"}!`;
  
  return new Response(
    JSON.stringify({ message }),
    { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    },
  );
});
