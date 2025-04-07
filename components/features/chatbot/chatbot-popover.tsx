'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageSquare } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
};

export default function ChatbotPopover() {
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full h-10 w-10 fixed bottom-4 right-4 shadow-md"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 sm:w-96 p-0" 
        align="end" 
        side="top"
        sideOffset={16}
      >
        <div className="flex flex-col h-96">
          <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-6 w-6 bg-primary-foreground text-primary rounded-full flex items-center justify-center mr-2">
                🤖
              </div>
              <h3 className="font-medium">Artist Assistant</h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                <p className="text-sm">Ask me anything about your artists!</p>
                <div className="mt-3 space-y-2">
                  <p className="text-xs">Try asking:</p>
                  <Button 
                    variant="outline" 
                    className="text-xs m-1 h-7" 
                    onClick={() => setInput("Tell me about Lady Gaga")}
                  >
                    Tell me about Lady Gaga
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-xs m-1 h-7" 
                    onClick={() => setInput("What are Beyoncé's top songs?")}
                  >
                    What are Beyoncé's top songs?
                  </Button>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start max-w-[85%]">
                    {message.role === 'assistant' && (
                      <Avatar className="h-6 w-6 mr-2">
                        <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-xs">
                          🤖
                        </div>
                      </Avatar>
                    )}
                    <Card className={`p-2 text-xs ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <div>{message.content}</div>
                      
                      {message.data?.artist && (
                        <div className="mt-1 pt-1 border-t border-border flex items-center">
                          {message.data.artist.image_url && (
                            <img 
                              src={message.data.artist.image_url} 
                              alt={message.data.artist.name}
                              className="h-6 w-6 rounded-full mr-1"
                            />
                          )}
                          <span className="text-xs font-semibold">{message.data.artist.name}</span>
                        </div>
                      )}
                    </Card>
                    {message.role === 'user' && (
                      <Avatar className="h-6 w-6 ml-2">
                        <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-xs">
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
                  <Avatar className="h-6 w-6 mr-2">
                    <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-xs">
                      🤖
                    </div>
                  </Avatar>
                  <Card className="p-2 bg-muted">
                    <div className="flex space-x-1">
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t p-3">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about an artist..."
                disabled={isLoading}
                className="flex-1 h-8 text-sm"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()} 
                size="sm"
                className="h-8"
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}