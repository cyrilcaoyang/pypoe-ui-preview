import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Send, 
  Bot, 
  User, 
  Settings2,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Loader2
} from 'lucide-react';
import { pyPoeAPI, type Message, type Conversation } from '@/services/api';

const chatModes = [
  { id: 'chatbot', name: 'Chat Bot', description: 'Single AI assistant' },
  { id: 'group', name: 'Group Chat', description: 'Multiple AI assistants' },
  { id: 'debate', name: 'AI Debate', description: 'Two AIs debate a topic' },
];

interface ChatInterfaceProps {
  chatMode: string;
  onChatModeChange: (mode: string) => void;
  selectedConversationId?: string;
  onConversationChange?: (conversationId: string) => void;
}

export function ChatInterface({ 
  chatMode, 
  onChatModeChange, 
  selectedConversationId,
  onConversationChange 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableBots, setAvailableBots] = useState<string[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  
  // Ref to track the complete streaming message content
  const streamingMessageRef = useRef('');
  
  // Lock bot selection during active single-bot conversations or when no conversation selected
  // For chatbot mode: lock when no conversation OR when conversation is selected
  // For other modes: only lock when no conversation is selected
  const isModelLocked = !selectedConversationId || (chatMode === 'chatbot' && currentConversation !== null);
  
  // Lock chat mode dropdown until other modes are implemented
  const isChatModeLocked = true;
  
  // New chat dialog state
  const [newChatTitle, setNewChatTitle] = useState('');
  const [newChatBot, setNewChatBot] = useState('');
  const [newChatMode, setNewChatMode] = useState('chatbot');

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Load available bots on mount
  useEffect(() => {
    loadAvailableBots();
  }, []);

  // Load conversation when selectedConversationId changes
  useEffect(() => {
    if (selectedConversationId) {
      loadConversation(selectedConversationId);
    } else {
      setCurrentConversation(null);
      setMessages([]);
      disconnectWebSocket();
    }
  }, [selectedConversationId]);

  const loadAvailableBots = async () => {
    try {
      const bots = await pyPoeAPI.getAvailableBots();
      setAvailableBots(bots);
      // Set default for new chat dialog only
      if (bots.length > 0 && !newChatBot) {
        setNewChatBot(bots[0]);
      }
    } catch (err) {
      console.error('Failed to load bots:', err);
      setError('Failed to load available bots');
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get conversation details
      const conversations = await pyPoeAPI.getConversations();
      const conversation = conversations.find(c => c.id === conversationId);
      
      if (!conversation) {
        setError('Conversation not found');
        return;
      }

      setCurrentConversation(conversation);
      setSelectedModel(conversation.bot_name);

      // Load messages
      const conversationMessages = await pyPoeAPI.getConversationMessages(conversationId);
      setMessages(conversationMessages);

      // Connect WebSocket for real-time chat
      connectWebSocket(conversationId);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = (conversationId: string) => {
    try {
      setIsConnecting(true);
      disconnectWebSocket(); // Close any existing connection

      const ws = pyPoeAPI.connectWebSocket(
        conversationId,
        handleWebSocketMessage,
        (error) => {
          console.error('WebSocket error:', error);
          setError('Connection error. Please try again.');
          setIsConnecting(false);
        },
        (event) => {
          console.log('WebSocket closed:', event);
          setIsConnecting(false);
        }
      );

      wsRef.current = ws;
      setIsConnecting(false);
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setError('Failed to connect to chat');
      setIsConnecting(false);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'user_message':
        // User message confirmation - already added to UI
        break;
      
      case 'bot_response_start':
        streamingMessageRef.current = '';
        setStreamingMessage('');
        setIsLoading(true);
        break;
      
      case 'bot_response_chunk':
        streamingMessageRef.current += data.content;
        setStreamingMessage(streamingMessageRef.current);
        break;
      
      case 'bot_response_end':
        // Add complete message to the conversation using the ref content
        const completeMessage: Message = {
          id: Date.now().toString(),
          conversation_id: selectedConversationId!,
          role: 'assistant',
          content: streamingMessageRef.current, // Use ref instead of state
          timestamp: new Date().toISOString(),
          bot_name: selectedModel
        };
        setMessages(prev => [...prev, completeMessage]);
        setStreamingMessage('');
        streamingMessageRef.current = '';
        setIsLoading(false);
        break;
      
      case 'error':
        setError(data.content);
        setIsLoading(false);
        setStreamingMessage('');
        streamingMessageRef.current = '';
        break;
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedConversationId || !wsRef.current || !selectedModel) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      conversation_id: selectedConversationId,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);
    
    // Send via WebSocket
    try {
      pyPoeAPI.sendWebSocketMessage(wsRef.current, inputValue, selectedModel);
      setInputValue('');
      setError(null);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateNewChat = async () => {
    if (!newChatTitle.trim() || !newChatBot) return;

    try {
      const response = await pyPoeAPI.createConversation(newChatTitle, newChatBot);
      setShowNewChatDialog(false);
      setNewChatTitle('');
      setNewChatBot('');
      
      // Apply the selected chat mode for the new conversation
      onChatModeChange(newChatMode);
      onConversationChange?.(response.conversation_id);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError('Failed to create new conversation');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const processContentForDisplay = (content: string) => {
    if (!content) return content;
    
    // Convert markdown images to clickable links
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    return content.replace(imagePattern, (match, altText, url) => {
      const displayText = altText || 'Generated Image';
      return `🖼️ ${displayText}`;
    });
  };

  const extractImageUrls = (content: string): Array<{alt: string, url: string}> => {
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images: Array<{alt: string, url: string}> = [];
    let match;
    
    while ((match = imagePattern.exec(content)) !== null) {
      images.push({
        alt: match[1] || 'Generated Image',
        url: match[2]
      });
    }
    
    return images;
  };

  const MessageContent = ({ content, className = "" }: { content: string; className?: string }) => {
    const processedContent = processContentForDisplay(content);
    const images = extractImageUrls(content);
    
    return (
      <div className={className}>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {processedContent}
        </div>
        {images.length > 0 && (
          <div className="mt-3 space-y-2">
            {images.map((image, index) => (
              <a
                key={index}
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                title="Click to open image in new tab"
              >
                🖼️ {image.alt}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Always visible */}
      <div className="border-b border-border p-4 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center gap-3">
              <Select value={chatMode} onValueChange={onChatModeChange} disabled={isChatModeLocked}>
                <SelectTrigger className={`w-64 ${isChatModeLocked ? 'opacity-60 cursor-not-allowed' : ''}`}>
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

              {currentConversation && (
                <div className="text-sm">
                  <div className="font-medium">Topic: {currentConversation.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {isConnecting ? 'Connecting...' : 'Connected'}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Lock bot selection during active single-bot conversations */}
            <Select 
              value={selectedModel} 
              onValueChange={setSelectedModel}
              disabled={isModelLocked}
            >
              <SelectTrigger className={`w-52 ${isModelLocked ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder="Select AI Bot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>
                  <span className="text-muted-foreground">Select AI Bot</span>
                </SelectItem>
                {availableBots.map((bot) => (
                  <SelectItem key={bot} value={bot}>
                    {bot}
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

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border-b border-destructive/20">
          <div className="text-destructive text-sm">{error}</div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {!selectedConversationId ? (
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Welcome to PyPoe</h3>
            <p className="text-muted-foreground mb-4">
              Select a conversation from the sidebar or create a new one to start chatting with AI bots.
            </p>
            <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Conversation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newChatTitle}
                      onChange={(e) => setNewChatTitle(e.target.value)}
                      placeholder="Enter conversation title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chatMode">Chat Mode</Label>
                    <Select value={newChatMode} onValueChange={setNewChatMode} disabled={true}>
                      <SelectTrigger className="opacity-60 cursor-not-allowed">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{chatModes.find(m => m.id === newChatMode)?.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {chatModes.find(m => m.id === newChatMode)?.description}
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
                  </div>
                  <div>
                    <Label htmlFor="bot">AI Bot</Label>
                    <Select value={newChatBot} onValueChange={setNewChatBot}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBots.map((bot) => (
                          <SelectItem key={bot} value={bot}>
                            {bot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleCreateNewChat} 
                    className="w-full"
                    disabled={!newChatTitle.trim() || !newChatBot}
                  >
                    Create Conversation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </Card>
        </div>
      ) : (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {isLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading conversation...</span>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
                        <Card className={`p-4 ${message.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-card'}`}>
                          <MessageContent content={message.content} />
                          {message.role === 'assistant' && (
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {message.bot_name || selectedModel}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(message.content)}
                                >
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
                        {message.role === 'user' && (
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                          </div>
                        )}
                      </div>

                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-secondary flex items-center justify-center flex-shrink-0 order-3">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Streaming message */}
                  {streamingMessage && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <Card className="p-4 bg-card max-w-[80%]">
                        <MessageContent content={streamingMessage} />
                        <span className="animate-pulse ml-1">|</span>
                      </Card>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
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
                  placeholder={selectedModel ? `Message ${selectedModel}...` : "Select AI bot to start chatting..."}
                  disabled={isLoading || !wsRef.current || isConnecting}
                  className="pr-12"
                />
              </div>
              <Button 
                onClick={handleSend} 
                disabled={!inputValue.trim() || isLoading || !wsRef.current || isConnecting || !selectedModel}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {currentConversation ? 
                (selectedModel ? `Chatting with ${selectedModel} in "${currentConversation.title}"` : 'Select an AI bot to start chatting') : 
                'Select a conversation to start chatting'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}