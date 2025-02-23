'use client';

import { useEffect, useState } from 'react';

export function TestProgress() {
  const [status, setStatus] = useState<string>('Not started');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/test-progress');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStatus(`${data.stage}: ${data.progress}% - ${data.message}`);
      } catch (error) {
        console.error('Parse error:', error);
        setError(`Failed to parse update: ${event.data}`);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setError('Connection error');
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="p-4">
      <h2>Test Progress</h2>
      <div>Status: {status}</div>
      {error && <div className="text-red-500">Error: {error}</div>}
    </div>
  );
} 