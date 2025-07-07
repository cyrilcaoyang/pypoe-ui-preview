import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Settings2,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ChevronDown
} from 'lucide-react';

const models = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
];

const chatModes = [
  { id: 'chatbot', name: 'Chat Bot', description: 'Single AI assistant' },
  { id: 'group', name: 'Group Chat', description: 'Multiple AI assistants' },
  { id: 'debate', name: 'AI Debate', description: 'Two AIs debate a topic' },
];

const sampleMessages = [
  {
    id: 1,
    type: 'user',
    content: 'Explain quantum computing in simple terms',
    timestamp: '2:30 PM'
  },
  {
    id: 2,
    type: 'bot',
    content: 'Quantum computing is like having a super-powered computer that can explore many solutions to a problem simultaneously. Unlike classical computers that use bits (0 or 1), quantum computers use quantum bits or "qubits" that can exist in multiple states at once through a property called superposition.\n\nThink of it like this: if classical computing is like reading a book page by page, quantum computing is like being able to read all pages simultaneously and finding the information you need much faster.',
    timestamp: '2:31 PM',
    model: 'GPT-4'
  }
];

interface ChatInterfaceProps {
  chatMode: string;
  onChatModeChange: (mode: string) => void;
}

export function ChatInterface({ chatMode, onChatModeChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState(sampleMessages);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [activeGroupBots, setActiveGroupBots] = useState(['gpt-4']);
  const [debateModels, setDebateModels] = useState(['gpt-4', 'claude-3']);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const newMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center gap-3">
              <Select value={chatMode} onValueChange={onChatModeChange}>
                <SelectTrigger className="w-64">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{chatModes.find(m => m.id === chatMode)?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {chatModes.find(m => m.id === chatMode)?.description}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {chatModes.map((mode) => (
                    <SelectItem key={mode.id} value={mode.id}>
                      <div>
                        <div className="font-medium">{mode.name}</div>
                        <div className="text-xs text-muted-foreground">{mode.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground font-medium">Select Chat Mode</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {model.provider}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.type === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : ''}`}>
                <Card className={`p-4 ${message.type === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-card'}`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                  {message.type === 'bot' && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {message.model}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
                {message.type === 'user' && (
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                )}
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-secondary flex items-center justify-center flex-shrink-0 order-3">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4 bg-background/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything... (Press Enter to send)"
              className="pr-12 resize-none min-h-[40px]"
            />
          </div>
          <Button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Using {models.find(m => m.id === selectedModel)?.name} • Shift+Enter for new line
          </p>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-muted-foreground">Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}