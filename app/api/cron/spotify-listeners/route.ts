import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Same flow that worked 10 months ago: Playwright scrape → process-spotify-listeners
// (same as /api/cron/spotify-metrics and the admin panel)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300; // 5 minutes

const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
};

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      },
      { status: 500 }
    );
  }

  const baseUrl = getBaseUrl();

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: artistData, error: artistError } = await supabase
      .from('artist_platform_ids')
      .select('platform_id')
      .eq('platform', 'spotify')
      .not('platform_id', 'is', null);

    if (artistError) {
      throw artistError;
    }

    const artistIds = (artistData || []).map((item) => item.platform_id);
    if (artistIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No artists with Spotify IDs to scrape',
        updatedCount: 0,
      });
    }

    const scrapeResponse = await fetch(`${baseUrl}/api/scrape/spotify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artistIds }),
    });

    const scrapeData = await scrapeResponse.json().catch(() => ({}));

    if (!scrapeResponse.ok) {
      const scrapeError = new Error(
        scrapeData.details ?? scrapeData.error ?? scrapeResponse.statusText
      ) as Error & { scrapeResponse?: unknown };
      scrapeError.scrapeResponse = {
        status: scrapeResponse.status,
        statusText: scrapeResponse.statusText,
        error: scrapeData.error,
        details: scrapeData.details,
      };
      throw scrapeError;
    }

    if (!scrapeData.results?.length) {
      return NextResponse.json({
        success: true,
        message: 'No results from scraping',
        updatedCount: 0,
      });
    }

    const processResponse = await fetch(`${baseUrl}/api/admin/process-spotify-listeners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: scrapeData.results }),
    });

    const processData = await processResponse.json().catch(() => ({}));

    if (!processResponse.ok) {
      const processError = new Error(
        processData.details ?? processData.error ?? processResponse.statusText
      ) as Error & { processResponse?: unknown };
      processError.processResponse = {
        status: processResponse.status,
        statusText: processResponse.statusText,
        error: processData.error,
        details: processData.details,
      };
      throw processError;
    }

    return NextResponse.json({
      success: true,
      message: 'Spotify listeners collection completed',
      updatedCount: processData.updatedCount ?? 0,
      processed: processData,
    });
  } catch (error) {
    console.error('[cron/spotify-listeners]', error);
    const err = error as Error & { scrapeResponse?: unknown; processResponse?: unknown };
    return NextResponse.json(
      {
        success: false,
        error: 'Spotify listeners collection failed',
        details: err.message,
        ...(err.scrapeResponse != null && { scrapeResponse: err.scrapeResponse }),
        ...(err.processResponse != null && { processResponse: err.processResponse }),
      },
      { status: 500 }
    );
  }
}
