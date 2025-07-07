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
  Terminal
} from 'lucide-react';

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

export function Sidebar() {
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