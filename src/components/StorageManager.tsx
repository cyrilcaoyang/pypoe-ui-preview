import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Database,
  HardDrive,
  Image,
  Video,
  Trash2,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Loader2,
  FileText
} from 'lucide-react';

interface StorageStats {
  total_conversations: number;
  enhanced_storage_available: boolean;
  database_path: string;
  media_files?: {
    total_files: number;
    total_size_bytes: number;
    total_size_mb: number;
    by_type: {
      image?: { count: number; size_mb: number };
      video?: { count: number; size_mb: number };
    };
  };
  storage_locations?: {
    database: { path: string; size_bytes: number; size_mb: number };
    media_directory: { path: string; size_bytes: number; size_mb: number };
  };
  total_storage?: {
    size_bytes: number;
    size_mb: number;
  };
}

interface ConversationWithStorage {
  id: string;
  title: string;
  bot_name: string;
  created_at: string;
  message_count: number;
  media_count: number;
  has_media: boolean;
}

export function StorageManager() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [conversations, setConversations] = useState<ConversationWithStorage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      
      // Load storage stats and conversations in parallel
      const [statsResponse, conversationsResponse] = await Promise.all([
        fetch('/api/storage/stats'),
        fetch('/api/storage/conversations')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        setConversations(conversationsData);
      }
    } catch (error) {
      console.error('Failed to load storage data:', error);
      toast({
        title: "Error",
        description: "Failed to load storage data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Are you sure you want to cleanup orphaned media files? This action cannot be undone.')) {
      return;
    }

    setIsCleaningUp(true);
    try {
      const response = await fetch('/api/storage/cleanup', { method: 'POST' });
      if (!response.ok) throw new Error('Cleanup failed');

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Cleanup Completed",
          description: `Cleaned ${result.files_cleaned} files, freed ${result.storage_freed_mb.toFixed(2)} MB`,
        });
        await loadData(); // Refresh data
      } else {
        throw new Error(result.message || 'Cleanup failed');
      }
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also delete associated media files.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/conversation/${conversationId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');

      const result = await response.json();
      
      if (result.success) {
        const mediaInfo = result.media_cleanup;
        let message = 'Conversation deleted successfully';
        
        if (mediaInfo.enhanced_storage && mediaInfo.media_files_deleted > 0) {
          message += ` (${mediaInfo.media_files_deleted} media files, ${mediaInfo.storage_freed_mb.toFixed(2)} MB freed)`;
        }
        
        toast({
          title: "Deleted",
          description: message,
        });
        await loadData(); // Refresh data
      } else {
        throw new Error('Failed to delete conversation');
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  const exportReport = () => {
    if (!stats) {
      toast({
        title: "Error",
        description: "No storage data available to export",
        variant: "destructive"
      });
      return;
    }

    const report = {
      timestamp: new Date().toISOString(),
      storage_summary: stats,
      conversations_summary: {
        total: conversations.length,
        with_media: conversations.filter(c => c.has_media).length,
        total_messages: conversations.reduce((sum, c) => sum + c.message_count, 0),
        total_media_files: conversations.reduce((sum, c) => sum + c.media_count, 0)
      },
      generated_by: 'PyPoe React Storage Management'
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pypoe-storage-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Storage report exported successfully",
    });
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading storage information...</span>
      </div>
    );
  }

  const storageUsagePercent = stats?.total_storage ? Math.min((stats.total_storage.size_mb / 100) * 100, 100) : 0;
  const isStorageHigh = storageUsagePercent > 70;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Storage Management</h2>
          <p className="text-muted-foreground">Monitor and manage PyPoe storage usage and media files</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadData} 
            disabled={isRefreshing}
            size="sm"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button variant="outline" onClick={exportReport} size="sm">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Storage Status Alert */}
      {isStorageHigh && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Storage usage is high ({storageUsagePercent.toFixed(1)}%). Consider cleaning up old conversations or media files.
          </AlertDescription>
        </Alert>
      )}

      {/* Storage Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Storage */}
        <Card className={isStorageHigh ? "border-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_storage ? `${stats.total_storage.size_mb.toFixed(2)} MB` : 'N/A'}
            </div>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between text-sm">
                <span>Database:</span>
                <span>{stats?.storage_locations?.database.size_mb.toFixed(2) || 0} MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Media Files:</span>
                <span>{stats?.storage_locations?.media_directory.size_mb.toFixed(2) || 0} MB</span>
              </div>
            </div>
            {stats?.total_storage && (
              <Progress value={storageUsagePercent} className="mt-2" />
            )}
          </CardContent>
        </Card>

        {/* Media Files */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.media_files?.total_files || 0}
            </div>
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  Images:
                </span>
                <span>{stats?.media_files?.by_type?.image?.count || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  Videos:
                </span>
                <span>{stats?.media_files?.by_type?.video?.count || 0}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total: {stats?.media_files?.total_size_mb.toFixed(2) || 0} MB
            </p>
          </CardContent>
        </Card>

        {/* Conversations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_conversations || 0}
            </div>
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-sm">
                <span>With Media:</span>
                <span>{conversations.filter(c => c.has_media).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Messages:</span>
                <span>{conversations.reduce((sum, c) => sum + c.message_count, 0)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {stats?.enhanced_storage_available ? (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">Enhanced Storage Available</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-yellow-600">Basic Storage Only</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Management Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button 
              variant="destructive" 
              onClick={handleCleanup}
              disabled={!stats?.enhanced_storage_available || isCleaningUp}
            >
              {isCleaningUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Cleanup Orphaned Files
            </Button>
            <Button variant="outline" onClick={loadData} disabled={isRefreshing}>
              <RefreshCw className="h-4 w-4" />
              Refresh Statistics
            </Button>
            <Button variant="outline" onClick={exportReport}>
              <Download className="h-4 w-4" />
              Export Storage Report
            </Button>
          </div>
          {!stats?.enhanced_storage_available && (
            <p className="text-sm text-muted-foreground mt-2">
              Enhanced storage features require the enhanced history manager
            </p>
          )}
        </CardContent>
      </Card>

      {/* Conversations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Conversations Storage Details</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No conversations found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{conversation.title || 'Untitled'}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {conversation.bot_name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(conversation.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">{conversation.message_count}</div>
                      <div className="text-xs text-muted-foreground">Messages</div>
                    </div>
                    
                    <div className="text-center">
                      <Badge variant={conversation.has_media ? "default" : "secondary"}>
                        {conversation.media_count}
                      </Badge>
                      <div className="text-xs text-muted-foreground">Media</div>
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteConversation(conversation.id, conversation.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 