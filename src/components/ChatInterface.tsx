import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles, Brain, Zap } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  model?: string;
  timestamp: Date;
}

interface Model {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const models: Model[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Most capable model',
    icon: <Brain className="h-4 w-4" />,
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Thoughtful and nuanced',
    icon: <Sparkles className="h-4 w-4" />,
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Fast and efficient',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m connected through PyPoe API. Which AI model would you like to chat with today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate API call to PyPoe backend
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `This is a simulated response from ${selectedModel.name}. In a real implementation, this would connect to your PyPoe Python backend to communicate with the actual AI models through the Poe API.`,
        role: 'assistant',
        model: selectedModel.name,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Model Selection */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2 overflow-x-auto">
          {models.map((model) => (
            <Button
              key={model.id}
              variant={selectedModel.id === model.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedModel(model)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              {model.icon}
              {model.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-fade-in ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
              
              <Card className={`max-w-[80%] p-3 card-glow ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground ml-12' 
                  : 'bg-card'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {message.role === 'assistant' && message.model && (
                    <Badge variant="secondary" className="text-xs">
                      {message.model}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </Card>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-glow">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              </div>
              <Card className="p-3 card-glow">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder={`Message ${selectedModel.name}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-background/50 backdrop-blur-sm border-border"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            variant="gradient"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Connected via PyPoe API • {selectedModel.description}
        </p>
      </div>
    </div>
  );
}