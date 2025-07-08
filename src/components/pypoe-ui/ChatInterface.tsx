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
  const [selectedModel, setSelectedModel] = useState('GPT-3.5-Turbo');
  const [availableBots, setAvailableBots] = useState<string[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  
  // Lock bot selection during active single-bot conversations
  const isModelLocked = chatMode === 'chatbot' && 
                       currentConversation && 
                       messages.length > 0 && 
                       messages.some(m => m.role === 'user');
  const [newChatTitle, setNewChatTitle] = useState('');
  const [newChatBot, setNewChatBot] = useState('');

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
      if (bots.length > 0 && !selectedModel) {
        setSelectedModel(bots[0]);
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
        setStreamingMessage('');
        setIsLoading(true);
        break;
      
      case 'bot_response_chunk':
        setStreamingMessage(prev => prev + data.content);
        break;
      
      case 'bot_response_end':
        // Add complete message to the conversation
        const completeMessage: Message = {
          id: Date.now().toString(),
          conversation_id: selectedConversationId!,
          role: 'assistant',
          content: streamingMessage,
          timestamp: new Date().toISOString(),
          bot_name: selectedModel
        };
        setMessages(prev => [...prev, completeMessage]);
        setStreamingMessage('');
        setIsLoading(false);
        break;
      
      case 'error':
        setError(data.content);
        setIsLoading(false);
        setStreamingMessage('');
        break;
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedConversationId || !wsRef.current) return;

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

  if (!selectedConversationId) {
    return (
      <div className="flex flex-col h-full">
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
      </div>
    );
  }

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
              {currentConversation && (
                <div className="text-sm">
                  <div className="font-medium">{currentConversation.title}</div>
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableBots.map((bot) => (
                  <SelectItem key={bot} value={bot}>
                    {bot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isModelLocked && (
              <div className="text-xs text-muted-foreground">
                Bot locked for this conversation
              </div>
            )}
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
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
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
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {streamingMessage}
                      <span className="animate-pulse">|</span>
                    </div>
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
              placeholder={`Message ${selectedModel}...`}
              disabled={isLoading || !wsRef.current || isConnecting}
              className="pr-12"
            />
          </div>
          <Button 
            onClick={handleSend} 
            disabled={!inputValue.trim() || isLoading || !wsRef.current || isConnecting}
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
          {currentConversation ? `Chatting with ${selectedModel} in "${currentConversation.title}"` : 'Select a conversation to start chatting'}
        </p>
      </div>
    </div>
  );
}