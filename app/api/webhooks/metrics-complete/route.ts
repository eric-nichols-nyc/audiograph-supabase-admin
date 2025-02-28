import { NextResponse } from 'next/server';
import { metricsStore } from '@/lib/metrics-store';

// You might want to add some authentication here
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    // Debug logging
    const authHeader = request.headers.get('Authorization');
    console.log('Received auth header:', authHeader);
    console.log('Expected auth header:', `Bearer ${WEBHOOK_SECRET}`);
    
    // Check authentication
    if (WEBHOOK_SECRET && (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`)) {
      console.log('Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the job data from the request
    const data = await request.json();
    
    // Validate the data
    if (!data.type || !data.status) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }
    
    // Add the update to the store
    metricsStore.addUpdate({
      type: data.type,
      status: data.status,
      timestamp: data.timestamp || new Date().toISOString(),
      artistsProcessed: data.artistsProcessed || 0,
    });
    
    // Log the event (optional)
    console.log(`Webhook received for ${data.type} job: ${data.status}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 