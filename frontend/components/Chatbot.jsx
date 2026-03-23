"use client"

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. & 7. FETCH FIXES & API CONNECTION
  // Replace relative calls with absolute URLs
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const apiUrl = `${baseUrl}/api/chat`;

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: apiUrl,
    onError: (err) => {
      console.error('[Chatbot UI Error]', err);
    },
    onFinish: (message) => {
      console.log('[Chatbot UI Response]', message);
    }
  });

  // Smooth scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 9. UI STATE: empty response, loading, error, etc. */}
      {isOpen && (
        <Card className="w-[350px] sm:w-[400px] h-[500px] flex flex-col shadow-2xl mb-4 animate-in slide-in-from-bottom-5 fade-in duration-300 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-3 pt-4 px-4 bg-primary/5">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Park_AI Assistant
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full border border-transparent hover:border-border">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface max-h-[380px]">
            {messages.length === 0 && !error ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-dark/60 space-y-2">
                <MessageCircle className="h-10 w-10 opacity-20" />
                <p className="text-sm px-4">Hi! I am the Park_AI assistant. How can I help you regarding parking or our system?</p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg text-sm shadow-sm ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-neutral text-foreground rounded-bl-none border border-border/50'
                  }`}>
                    {/* 9. Handle empty response safety */}
                    {m.content || <span className="italic opacity-50">Empty response</span>}
                  </div>
                </div>
              ))
            )}

            {/* 9. Loading State */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg bg-neutral text-foreground rounded-bl-none border border-border/50 flex space-x-2 items-center">
                  <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce delay-75" />
                  <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            )}
            
            {/* 9. Error State */}
            {error && (
              <div className="flex flex-col items-center gap-2 p-3 my-2 text-sm text-danger bg-danger/10 rounded border border-danger/20">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Connection Failed
                </div>
                <div className="text-center opacity-90 text-xs">
                  {error.message || 'System is currently unavailable. Please check API keys.'}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="p-3 border-t bg-background">
            <form onSubmit={(e) => {
              console.log(`[Chatbot UI Submit] POST -> ${apiUrl}`);
              handleSubmit(e);
            }} className="flex w-full gap-2 relative">
              <input
                value={input}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Type your message..."
                className="flex-1 h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary rounded-md border border-input bg-transparent disabled:opacity-50 transition-shadow"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="h-10 w-10 shrink-0">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl transition-all duration-300 flex items-center justify-center p-0 group"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="sr-only">Open Chatbot</span>
        </Button>
      )}
    </div>
  );
}
