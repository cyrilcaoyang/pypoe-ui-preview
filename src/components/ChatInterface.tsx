import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Bot, User, Sparkles, Brain, Zap, Plus, MessageSquare } from 'lucide-react';
import { createPyPoeAPI } from '@/services/api';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  model?: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  bot_name: string;
  chat_mode?: string;
}

interface Model {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

// Helper function to get icon for model
const getModelIcon = (modelName: string) => {
  if (modelName.includes('DALL-E') || modelName.includes('FLUX') || modelName.includes('Stable-Diffusion') || modelName.includes('Imagen')) {
    return <Sparkles className="h-4 w-4" />;
  }
  if (modelName.includes('Claude')) {
    return <Zap className="h-4 w-4" />;
  }
  if (modelName.includes('GPT-4') || modelName.includes('o1') || modelName.includes('o3') || modelName.includes('o4')) {
    return <Sparkles className="h-4 w-4" />;
  }
  return <Brain className="h-4 w-4" />;
};

// Helper function to get model description
const getModelDescription = (modelName: string) => {
  if (modelName.includes('DALL-E')) return 'AI image generation';
  if (modelName.includes('FLUX')) return 'Advanced image generation';
  if (modelName.includes('Stable-Diffusion')) return 'Open source image generation';
  if (modelName.includes('Imagen')) return 'Google image generation';
  if (modelName.includes('Claude')) return 'Thoughtful and nuanced';
  if (modelName.includes('GPT-4')) return 'Most capable text model';
  if (modelName.includes('o1') || modelName.includes('o3')) return 'Advanced reasoning model';
  if (modelName.includes('Gemini')) return 'Google multimodal AI';
  if (modelName.includes('Llama')) return 'Meta open source model';
  return 'AI assistant';
};

// Helper function to process content for image display
const processContentForDisplay = (content: string): { text: string; hasImages: boolean; hasChainOfThought: boolean } => {
  if (!content) return { text: content, hasImages: false, hasChainOfThought: false };

  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let hasImages = false;
  
  let processedText = content;
  
  // Process images
  processedText = processedText.replace(imagePattern, (match, altText, url) => {
    hasImages = true;
    const displayText = altText || 'Generated Image';
    return `🖼️ ${displayText}`;
  });

  return { text: processedText, hasImages, hasChainOfThought: false };
};

// Helper function to extract image URLs
const extractImageUrls = (content: string): Array<{ url: string; altText: string }> => {
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: Array<{ url: string; altText: string }> = [];
  let match;

  while ((match = imagePattern.exec(content)) !== null) {
    images.push({
      url: match[2],
      altText: match[1] || 'Generated Image'
    });
  }

  return images;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('GPT-3.5-Turbo');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isShowingThinking, setIsShowingThinking] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const apiRef = useRef(createPyPoeAPI('http://localhost:8000', btoa('sdl2:accelerate')));

  const isThinkingMessage = (content: string): boolean => {
    const thinkingPattern = /^(Thinking|Generating)\.+(\s*\(\d+s elapsed\))?$/;
    return thinkingPattern.test(content.trim());
  };

  // Initialize component
  useEffect(() => {
    loadAvailableModels();
    loadConversations();
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      await apiRef.current.getHealthStatus();
      setIsConnected(true);
    } catch (error) {
      console.error('Backend connection failed:', error);
      setIsConnected(false);
    }
  };

  const loadAvailableModels = async () => {
    try {
      const models = await apiRef.current.getAvailableBots();
      setAvailableModels(models);
      if (models.length > 0 && selectedModel === 'GPT-3.5-Turbo' && !models.includes('GPT-3.5-Turbo')) {
        setSelectedModel(models[0]);
      }
    } catch (error) {
      console.error('Failed to load available models:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await apiRef.current.getConversations();
      setConversations(convs);
      
      // Don't auto-select conversations - let user choose
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    
    // Load messages for this conversation
    try {
      const msgs = await apiRef.current.getConversationMessages(conversation.id);
      setMessages(msgs.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        model: msg.bot_name,
        timestamp: new Date(msg.timestamp)
      })));
      
      // Update selected model based on conversation
      if (availableModels.includes(conversation.bot_name)) {
        setSelectedModel(conversation.bot_name);
      }
      
      // Setup WebSocket for this conversation
      setupWebSocket(conversation.id);
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const modelDisplayName = selectedModel.includes('DALL-E') ? 'DALL-E' : 
                              selectedModel.includes('Claude') ? 'Claude' : 
                              selectedModel.includes('GPT-4') ? 'GPT-4' : selectedModel;
      
      const response = await apiRef.current.createConversation(
        `Chat with ${modelDisplayName}`,
        selectedModel
      );
      
      const convs = await apiRef.current.getConversations();
      setConversations(convs);
      
      // Find and select the new conversation
      const newConv = convs.find(c => c.id === response.conversation_id);
      if (newConv) {
        selectConversation(newConv);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const setupWebSocket = (conversationId: string) => {
    // Close existing WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }

    wsRef.current = apiRef.current.connectWebSocket(
      conversationId,
      handleWebSocketMessage,
      (error) => console.error('WebSocket error:', error),
      () => console.log('WebSocket closed')
    );
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'user_message':
        // User message confirmation - already added locally
        break;
        
      case 'bot_response_start':
        setIsLoading(true);
        setStreamingContent('');
        setIsShowingThinking(false);
        
        // Add empty assistant message that we'll update
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: '',
          role: 'assistant',
          model: currentConversation?.bot_name || selectedModel,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        break;
        
      case 'bot_response_chunk':
        if (data.content) {
          // Check if this chunk is a thinking/generating message
          if (isThinkingMessage(data.content)) {
            // Only show thinking if we haven't accumulated any real content yet
            if (streamingContent === '') {
              setIsShowingThinking(true);
              setMessages(prevMessages => {
                const updated = [...prevMessages];
                if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
                  updated[updated.length - 1].content = data.content;
                }
                return updated;
              });
            }
            return;
          }

          // Real content - reset thinking state if needed
          if (isShowingThinking) {
            setIsShowingThinking(false);
            setStreamingContent('');
          }

          // Accumulate content and update the last message
          setStreamingContent(prev => {
            const newContent = prev + data.content;
            setMessages(prevMessages => {
              const updated = [...prevMessages];
              if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
                updated[updated.length - 1].content = newContent;
              }
              return updated;
            });
            return newContent;
          });
        }
        break;
        
      case 'bot_response_end':
        setIsLoading(false);
        setStreamingContent('');
        setIsShowingThinking(false);
        break;
        
      case 'error':
        setIsLoading(false);
        console.error('WebSocket error:', data.content);
        break;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentConversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsLoading(true);

    // Send message via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      apiRef.current.sendWebSocketMessage(wsRef.current, messageText, selectedModel);
    } else {
      console.error('WebSocket not connected');
      setIsLoading(false);
    }
  };

  const MessageContent = ({ message }: { message: Message }) => {
    const { text, hasImages } = processContentForDisplay(message.content);
    const images = extractImageUrls(message.content);
    
    return (
      <div>
        <ResponseContent content={text} images={images} />
      </div>
    );
  };



  const ResponseContent = ({ content, images }: { content: string; images: Array<{ url: string; altText: string }> }) => {
    return (
      <div className="response-content">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        
        {images.length > 0 && (
          <div className="mt-2 space-y-2">
            {images.map((img, index) => (
              <a
                key={index}
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 underline text-sm"
              >
                🖼️ {img.altText}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Backend Not Connected</h3>
          <p className="text-muted-foreground mb-4">
            Make sure PyPoe backend is running on port 8000
          </p>
          <Button onClick={checkBackendConnection}>Retry Connection</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with conversation selector and new chat button */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            {conversations.length > 0 && (
              <Select
                value={currentConversation?.id || ""}
                onValueChange={(value) => {
                  const conv = conversations.find(c => c.id === value);
                  if (conv) selectConversation(conv);
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select conversation">
                    {currentConversation ? (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {currentConversation.title}
                      </div>
                    ) : (
                      "Select conversation"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {conversations.map((conv) => (
                    <SelectItem key={conv.id} value={conv.id}>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{conv.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {conv.bot_name}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {currentConversation && (
              <div className="text-sm text-muted-foreground">
                Bot: {currentConversation.bot_name}
              </div>
            )}
          </div>
          <Button 
            onClick={createNewConversation} 
            size="sm" 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        
        {/* Model Selection */}
        <div className="flex gap-2 overflow-x-auto">
          {availableModels.slice(0, 8).map((model) => (
            <Button
              key={model}
              variant={selectedModel === model ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedModel(model)}
              className="flex items-center gap-2 whitespace-nowrap"
              disabled={currentConversation !== null} // Disable if conversation exists
            >
              {getModelIcon(model)}
              {model.length > 15 ? model.substring(0, 12) + '...' : model}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {!currentConversation ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Welcome to PyPoe</h3>
              <p className="text-muted-foreground mb-4">Create a new conversation to get started</p>
              <Button onClick={createNewConversation}>
                <Plus className="h-4 w-4 mr-2" />
                New Conversation
              </Button>
            </div>
          </div>
        ) : (
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
                  <MessageContent message={message} />
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
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder={`Message ${selectedModel.length > 20 ? selectedModel.substring(0, 17) + '...' : selectedModel}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1 bg-background/50 backdrop-blur-sm border-border"
            disabled={isLoading || !currentConversation}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading || !currentConversation}
            variant="gradient"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {isConnected ? 'Connected to PyPoe API' : 'Disconnected'} • {getModelDescription(selectedModel)}
        </p>
      </div>
    </div>
  );
}