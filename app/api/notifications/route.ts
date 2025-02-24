import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  // Get the current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Fetch notifications for the current user
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // Get the current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Parse the JSON payload
  let body: {
    title: string;
    message: string;
    type: string;
    link?: string;
  };
  
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  
  // Insert new notification with the current user's id as account_id in realtime
  const { data, error } = await supabase
    .from("notifications")
    .upsert([
      {
        account_id: user.id,
        title: body.title,
        message: body.message,
        type: body.type,
        link: body.link || null,
      },
    ])
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ notification: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  
  // Get the current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Parse the notification id from query parameters
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return NextResponse.json({ error: "Notification id is required" }, { status: 400 });
  }
  
  // Delete the notification ensuring it belongs to the authenticated user
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("account_id", user.id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ message: "Notification deleted successfully" });
} 