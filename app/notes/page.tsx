import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import NotificationsPopover from "@/components/features/notifications/notifications-popover";
import { fetchUserNotes, deleteNoteById } from "./actions";
import NewNotificationForm from "@/components/features/notifications/new-notification-form";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(user?.id);

  if (!user) {
    return redirect("/sign-in");
  }

  // Check if the user is admin by querying the user_roles table
  const { data: accountData, error: accountError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (accountError) {
    console.error("Error fetching user account:", accountError.message);
  } else if (accountData) {
    console.log(accountData);
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div>
        <h2 className="text-2xl font-bold mb-4">Notes & Notifications</h2>
        <NewNotificationForm />
      </div>
    </div>
  );
}
