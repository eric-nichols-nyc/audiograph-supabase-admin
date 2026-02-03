import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (_req) => {
  const baseUrl = Deno.env.get("SUPABASE_URL");
  if (!baseUrl) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing SUPABASE_URL" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const url = `${baseUrl}/functions/v1/collect-artist-metrics`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({}),
    });

    const result = await response.json().catch(() => ({}));
    console.log("Collect artist metrics result:", result);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: result.error ?? result.details ?? response.statusText }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in scheduled-artist-metrics:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
