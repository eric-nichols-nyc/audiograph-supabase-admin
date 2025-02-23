import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  const stream = new ReadableStream({
    async start(controller) {
      // Send a few test updates
      const updates = [
        { stage: 'START', progress: 0, message: 'Starting...' },
        { stage: 'MIDDLE', progress: 50, message: 'Half way...' },
        { stage: 'END', progress: 100, message: 'Done!' }
      ];

      // Send updates with delay
      for (const update of updates) {
        controller.enqueue(`data: ${JSON.stringify(update)}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }

      controller.close();
    }
  });

  return new Response(stream, { headers });
} 