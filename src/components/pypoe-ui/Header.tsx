import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github, Settings, Zap } from 'lucide-react';
import pypoeImage from '@/assets/pypoe-logo.jpg';

export function Header() {
  return (
    <header className="border-b border-border bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={pypoeImage} 
                alt="PyPoe Logo" 
                className="h-10 w-auto rounded-lg shadow-glow"
              />
              <div>
                <h1 className="text-xl font-bold gradient-text">PyPoe</h1>
                <p className="text-xs text-muted-foreground">AI Interface</p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Connected
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://github.com/cyrilcaoyang/PyPoe" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}