// Import our browser client implementation
import { createBrowserSupabase } from "@/lib/supabase/client";
// Import our custom User type that defines the shape of user data we need
import { User } from "@/types/user";

/**
 * Gets the Supabase auth instance for client-side authentication
 * @returns The Supabase auth instance configured with environment variables
 */
export async function getAuth() {
    const { auth } = createBrowserSupabase();  // Use our implementation
    return auth;
}

/**
 * Fetches the currently authenticated user and maps it to our User type
 * @returns Promise resolving to User object if authenticated, null if not
 */
export async function getUser(): Promise<User | null> {
    const auth = await getAuth();
    const {
        data: { user },
    } = await auth.getUser();

    if (!user) return null;

    // Map Supabase user to our custom User type with required fields
    return {
        id: user.id,
        email: user.email!, // Non-null assertion since we require email
        role: user.role ?? 'user' // Default to 'user' role if none set
    };
}