import { createClient } from "@/utils/supabase/server";
import { User } from "@/types/user";

export async function getUser(): Promise<User | null> {
    const supabase = await createClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) return null;

    return {
        id: user.id,
        email: user.email!,
        role: user.role ?? 'user',
    };
}