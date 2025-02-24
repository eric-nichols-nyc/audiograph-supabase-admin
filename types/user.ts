import { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string | undefined;
  role: string;
}