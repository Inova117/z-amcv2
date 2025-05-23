
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/EmptyState';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you're asking about "${inputValue}". Here's a strategic recommendation based on your marketing goals. Let me analyze your current campaigns and provide actionable insights.`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewStrategy = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: "Hi! I'm your AI marketing strategist. I can help you with campaign planning, audience analysis, content strategy, and performance optimization. What would you like to work on today?",
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Strategy Chat</h1>
            <p className="text-muted-foreground mt-1">
              Get AI-powered marketing insights and strategic guidance
            </p>
          </div>
          {messages.length > 0 && (
            <Button variant="outline" onClick={() => setMessages([])}>
              Clear Chat
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <EmptyState
            title="Start a Strategy Session"
            description="Begin a conversation with our AI strategist to get marketing insights, campaign ideas, and performance recommendations."
            icon="🤖"
            action={{
              label: "Start Strategy Chat",
              onClick: startNewStrategy,
            }}
          />
        ) : (
          <ScrollArea className="h-full p-6">
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    className={`max-w-[80%] ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">
                          {message.sender === 'user' ? '👤' : '🤖'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">🤖</div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-75"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input */}
      {messages.length > 0 && (
        <div className="p-6 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your marketing strategy..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
