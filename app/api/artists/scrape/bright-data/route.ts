import { NextRequest, NextResponse } from 'next/server';

// Securely get API token - should be in your environment variables
const API_TOKEN = process.env.BRIGHT_DATA_API_TOKEN;
const COLLECTOR_ID = process.env.BRIGHT_DATA_COLLECTOR_ID || "c_m7o1my9x1u3cmu5hhc";

export async function POST(request: NextRequest) {
  try {
    // Get artist data from request
 
    
    // Trigger the Bright Data collector
    const triggerResponse = await fetch(
      `https://api.brightdata.com/dca/trigger?collector=${COLLECTOR_ID}&queue_next=1`, 
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: [{}],
          deliver: {
            type: "api_pull",
            flatten_csv: false,
            delivery_type: "deliver_results",
            filename: {}
          }
        })
      }
    );
    
    if (!triggerResponse.ok) {
      return NextResponse.json(
        { error: `Failed to trigger collector: ${triggerResponse.statusText}` },
        { status: 500 }
      );
    }
    
    const triggerData = await triggerResponse.json();
    console.log('triggerData', triggerData);
    const datasetId = triggerData.collection_id;
    
    // Return dataset ID - for immediate response
    return NextResponse.json({
      success: true,
      datasetId,
      message: "Scraping job initiated. Use the datasetId to fetch results.",
      status: "PROCESSING"
    });
    
  } catch (error) {
    console.error("Error triggering scraper:", error);
    return NextResponse.json(
      { error: error.message || "Failed to trigger scraping job" },
      { status: 500 }
    );
  }
}

// Separate endpoint to check scraping results
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const datasetId = searchParams.get('datasetId');
  
  if (!datasetId) {
    return NextResponse.json(
      { error: "datasetId parameter is required" },
      { status: 400 }
    );
  }
  
  try {
    const resultsResponse = await fetch(
      `https://api.brightdata.com/dca/dataset?id=${datasetId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );
    
    if (!resultsResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch results: ${resultsResponse.statusText}` },
        { status: 500 }
      );
    }
    
    const data = await resultsResponse.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch scraping results" },
      { status: 500 }
    );
  }
}