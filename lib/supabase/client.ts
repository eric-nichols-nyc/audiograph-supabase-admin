// Import the helper function to create a Supabase client
// that is pre-configured for client-side (browser) usage.
import { createBrowserClient } from "@supabase/ssr";

// Create the browser client
export const createBrowserSupabase = () =>
  createBrowserClient(
    // The Supabase URL is read from the environment variable and is used as the 
    // Supabase project endpoint.
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // The Supabase anon key is read from the environment variable and is used 
    // to authenticate client-side requests.
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Export a singleton instance for direct use
export const supabase = createBrowserSupabase();