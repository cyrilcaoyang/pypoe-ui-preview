import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  History, 
  Settings, 
  User, 
  Bot,
  Activity,
  FileText,
  Terminal,
  Plus,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { pyPoeAPI, type Conversation, type ConversationStats } from '@/services/api';

interface SidebarProps {
  chatMode: string;
  onConversationSelect?: (conversationId: string) => void;
  onNewConversation?: () => void;
  selectedConversationId?: string;
}

export function Sidebar({ 
  chatMode, 
  onConversationSelect, 
  onNewConversation,
  selectedConversationId 
}: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [conversationsData, statsData] = await Promise.all([
        pyPoeAPI.getConversations(),
        pyPoeAPI.getStats()
      ]);
      
      setConversations(conversationsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations. Is the PyPoe backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadConversations();
      return;
    }

    try {
      const searchResults = await pyPoeAPI.searchConversations(query);
      setConversations(searchResults);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    loadConversations();
  }, []);

  if (error) {
    return (
      <div className="w-80 h-full bg-background/30 backdrop-blur-sm border-r border-border flex flex-col">
        <div className="p-4">
          <Card className="p-4 border-destructive">
            <div className="text-destructive text-sm">{error}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={loadConversations}
            >
              Retry
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-background/30 backdrop-blur-sm border-r border-border flex flex-col">
      {/* User Profile */}
      <div className="p-4 border-b border-border">
        <Card className="p-3 card-glow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium">Developer</p>
              <p className="text-xs text-muted-foreground">PyPoe Connected</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium mb-3">Statistics</h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm">Total Chats</span>
              </div>
              <Badge variant="secondary">{stats.total_conversations}</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm">Messages</span>
              </div>
              <Badge variant="secondary">{stats.total_messages}</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-sm">Bots Used</span>
              </div>
              <Badge variant="secondary">{Object.keys(stats.bot_usage).length}</Badge>
            </div>
          </div>
        ) : null}
      </div>

      {/* Search and New Chat */}
      <div className="p-4 border-b border-border">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={onNewConversation}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Recent Chats</h3>
          <Button variant="ghost" size="sm" onClick={loadConversations}>
            <History className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <Card className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No conversations found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery ? 'Try a different search term' : 'Create your first chat'}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <Card 
                  key={conv.id} 
                  className={`p-3 hover:bg-accent/50 cursor-pointer transition-all ${
                    selectedConversationId === conv.id ? 'bg-accent border-primary' : ''
                  }`}
                  onClick={() => onConversationSelect?.(conv.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {conv.bot_name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(conv.created_at)}
                        </span>
                      </div>
                      {conv.message_count !== undefined && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {conv.message_count} messages
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <FileText className="h-4 w-4" />
            Documentation
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Terminal className="h-4 w-4" />
            CLI Version
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}