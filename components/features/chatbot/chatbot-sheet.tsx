'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
};

export default function ChatbotSheet() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Show loading state
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          data: data
        }]);
      }
    } catch (error) {
      console.error('Error fetching from chatbot API:', error);
      toast.error('Failed to get a response from the chatbot');
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error processing your request." 
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full h-12 w-12 fixed top-1/2 -translate-y-1/2 right-6 shadow-md"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="p-0 sm:max-w-md flex flex-col h-full">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center">
            <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mr-2">
              🤖
            </div>
            Artist Assistant
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              <h3 className="text-lg font-medium mb-2">Ask me anything about your artists!</h3>
              <p className="text-sm mb-6">I can help you find information about artists, tracks, metrics, and more.</p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Try asking:</p>
                <Button 
                  variant="outline" 
                  className="text-sm m-1" 
                  onClick={() => setInput("Tell me about Lady Gaga")}
                >
                  Tell me about Lady Gaga
                </Button>
                <Button 
                  variant="outline" 
                  className="text-sm m-1" 
                  onClick={() => setInput("What are Beyoncé's top songs?")}
                >
                  What are Beyoncé's top songs?
                </Button>
                <Button 
                  variant="outline" 
                  className="text-sm m-1" 
                  onClick={() => setInput("Who are similar artists to Drake?")}
                >
                  Who are similar artists to Drake?
                </Button>
                <Button 
                  variant="outline" 
                  className="text-sm m-1" 
                  onClick={() => setInput("Show me metrics for The Weeknd")}
                >
                  Show me metrics for The Weeknd
                </Button>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div 
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start max-w-[80%]">
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 mr-2">
                      <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center">
                        🤖
                      </div>
                    </Avatar>
                  )}
                  <Card className={`p-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <div className="text-sm">{message.content}</div>
                    
                    {message.data?.artist && (
                      <div className="mt-2 pt-2 border-t border-border flex items-center">
                        {message.data.artist.image_url && (
                          <img 
                            src={message.data.artist.image_url} 
                            alt={message.data.artist.name}
                            className="h-8 w-8 rounded-full mr-2"
                          />
                        )}
                        <span className="text-sm font-semibold">{message.data.artist.name}</span>
                      </div>
                    )}
                  </Card>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 ml-2">
                      <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center">
                        👤
                      </div>
                    </Avatar>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start">
                <Avatar className="h-8 w-8 mr-2">
                  <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center">
                    🤖
                  </div>
                </Avatar>
                <Card className="p-3 bg-muted">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
        
        <SheetFooter className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2 w-full">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about an artist..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              Send
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}