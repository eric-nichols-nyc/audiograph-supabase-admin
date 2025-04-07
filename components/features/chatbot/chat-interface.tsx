'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/sonner';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      toast({
        title: 'Error',
        description: 'Failed to get a response from the chatbot',
        variant: 'destructive',
      });
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error processing your request." 
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Ask me anything about your artists!</p>
            <div className="mt-4 space-y-2">
              <p className="text-sm">Try asking:</p>
              <Button 
                variant="outline" 
                className="text-xs m-1" 
                onClick={() => setInput("Tell me about Lady Gaga")}
              >
                Tell me about Lady Gaga
              </Button>
              <Button 
                variant="outline" 
                className="text-xs m-1" 
                onClick={() => setInput("What are Beyoncé's top songs?")}
              >
                What are Beyoncé's top songs?
              </Button>
              <Button 
                variant="outline" 
                className="text-xs m-1" 
                onClick={() => setInput("Who are similar artists to Drake?")}
              >
                Who are similar artists to Drake?
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
                      <span className="text-xs font-semibold">{message.data.artist.name}</span>
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
      
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
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
      </div>
    </div>
  );
}