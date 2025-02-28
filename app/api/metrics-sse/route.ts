import { metricsStore } from '@/lib/metrics-store';

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Flag to track if controller is closed
      let isControllerClosed = false;
      
      // Keep the connection alive
      const keepAlive = setInterval(() => {
        if (!isControllerClosed) {
          try {
            controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'));
          } catch (error) {
            console.log('Controller already closed, clearing interval');
            clearInterval(keepAlive);
            isControllerClosed = true;
          }
        }
      }, 30000);
      
      // Subscribe to metrics updates
      const unsubscribe = metricsStore.subscribe(update => {
        if (!isControllerClosed) {
          try {
            controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(update)}\n\n`));
          } catch (error) {
            console.log('Controller closed during message send');
            isControllerClosed = true;
          }
        }
      });
      
      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        console.log('Client disconnected, cleaning up');
        clearInterval(keepAlive);
        unsubscribe();
        isControllerClosed = true;
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 