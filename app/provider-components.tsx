'use client';

import { Toaster } from '@/components/ui/sonner';
import ChatbotSheet from '@/components/features/chatbot/chatbot-sheet';

export function ProviderComponents() {
  return (
    <>
      <Toaster />
      <ChatbotSheet />
    </>
  );
}