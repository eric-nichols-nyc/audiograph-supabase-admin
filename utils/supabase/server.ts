// Import the helper function to create a Supabase client 
// that is pre-configured for server-side rendering.
import { createServerClient } from "@supabase/ssr";

// Import Next.js cookies helper to interact with server-side cookies.
import { cookies } from "next/headers";

// This asynchronous function initializes and returns a Supabase client.
// It is mainly used in server-side environments (like in server components
// or API routes) where you need to interact with Supabase securely.
export const createClient = async () => {
  // Retrieve the cookie store from Next.js. This provides access to
  // the cookies sent with the client request.
  const cookieStore = await cookies();

  // Create and return a new Supabase server client.
  // The client is set up with the Supabase URL and anon key provided
  // as environment variables at runtime. The cookies helper is passed into
  // the configuration so that any Supabase operations relying on cookies
  // (e.g., auth session tokens) work seamlessly.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // Supabase project URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Public anon key
    {
      cookies: {
        // Provide a method to get all cookies available in the request.
        getAll() {
          return cookieStore.getAll();
        },
        // Provide a method to set cookies (e.g., for updating session tokens).
        // This method catches any errors that might occur if it's called from a
        // server component context where setting cookies is not allowed.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // If the cookie cannot be set (likely due to being in a non-handling context),
            // the error is caught and logged or silently handled here.
            // This is especially useful in cases where middleware is updating sessions.
          }
        },
      },
    },
  );
};