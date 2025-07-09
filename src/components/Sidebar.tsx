import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  History, 
  Settings, 
  User, 
  Bot,
  Activity,
  FileText,
  Terminal,
  Database,
  HardDrive,
  Image,
  Video
} from 'lucide-react';
import { useState, useEffect } from 'react';

const conversations = [
  { id: '1', title: 'Quantum Computing Basics', model: 'GPT-4', time: '2m ago' },
  { id: '2', title: 'Python Data Analysis', model: 'Claude', time: '1h ago' },
  { id: '3', title: 'Machine Learning Concepts', model: 'Gemini', time: '3h ago' },
];

const stats = [
  { label: 'Total Chats', value: '127', icon: MessageSquare },
  { label: 'API Calls', value: '1.2k', icon: Activity },
  { label: 'Models Used', value: '8', icon: Bot },
];

interface StorageStats {
  total_conversations: number;
  enhanced_storage_available: boolean;
  media_files?: {
    total_files: number;
    total_size_mb: number;
    by_type: Record<string, any>;
  };
  total_storage?: {
    size_mb: number;
  };
}

export function Sidebar() {
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);

  useEffect(() => {
    const loadStorageStats = async () => {
      try {
        const response = await fetch('/api/storage/stats');
        if (response.ok) {
          const data = await response.json();
          setStorageStats(data);
        }
      } catch (error) {
        console.error('Failed to load storage stats:', error);
      } finally {
        setIsLoadingStorage(false);
      }
    };

    loadStorageStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStorageStats, 30000);
    return () => clearInterval(interval);
  }, []);

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
              <p className="text-xs text-muted-foreground">Pro Plan</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium mb-3">Statistics</h3>
        <div className="grid grid-cols-1 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <stat.icon className="h-4 w-4 text-primary" />
                <span className="text-sm">{stat.label}</span>
              </div>
              <Badge variant="secondary">{stat.value}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Storage Monitoring */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Storage</h3>
          <Database className="h-4 w-4 text-primary" />
        </div>
        
        {isLoadingStorage ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : storageStats ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Conversations</span>
              </div>
              <Badge variant="secondary">{storageStats.total_conversations}</Badge>
            </div>
            
            {storageStats.enhanced_storage_available && storageStats.media_files && (
              <>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Media Files</span>
                  </div>
                  <Badge variant="secondary">{storageStats.media_files.total_files}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Total Size</span>
                  </div>
                  <Badge variant="secondary">
                    {storageStats.total_storage ? 
                      `${storageStats.total_storage.size_mb.toFixed(1)}MB` : 
                      `${storageStats.media_files.total_size_mb.toFixed(1)}MB`
                    }
                  </Badge>
                </div>
              </>
            )}
            
            {!storageStats.enhanced_storage_available && (
              <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Enhanced storage not available
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-600 dark:text-red-400">
              Failed to load storage stats
            </p>
          </div>
        )}
      </div>

      {/* Recent Conversations */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Recent Chats</h3>
          <Button variant="ghost" size="sm">
            <History className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Card key={conv.id} className="p-3 hover:bg-accent/50 cursor-pointer transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conv.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {conv.model}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{conv.time}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
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