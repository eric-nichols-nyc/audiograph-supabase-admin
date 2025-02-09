"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";


export const fetchUserNotes = async (userId: string) => {
  const supabase = await createClient();
  // Query the notes table for the provided user ID
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

// New action to delete a note by its ID
export const deleteNoteById = async (noteId: string) => {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId);
  if (error) {
    throw new Error(error.message);
  }
  return noteId;
};
