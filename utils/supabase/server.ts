import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// For server components
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Use synchronous version for server components
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        set(name: string, value: string, options: any) {
          // Use synchronous version for server components
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          // Use synchronous version for server components
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// For API routes - doesn't use cookies
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  }

  if (!key) {
    console.error('Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is defined');
  }

  console.log('Creating Supabase service client with URL:', url);
  // Don't log the full key for security reasons
  console.log('Key available:', !!key);

  return createSupabaseClient<Database>(url!, key!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
