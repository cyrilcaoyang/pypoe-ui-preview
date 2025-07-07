import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Github, Settings, Zap, WifiOff, Sun, Moon } from 'lucide-react';
import accelerationLogo from '@/assets/acceleration-consortium-logo.png';

export function Header() {
  // Mock connection state - replace with actual state management
  const isConnected = false;
  const ipAddresses = {
    primary: "100.64.254.123:5000",
    secondary: "172.32.45.67:5000"
  };

  // Theme state - replace with actual theme management
  const isDarkMode = true;
  const toggleTheme = () => {
    // Add theme toggle logic here
    console.log('Toggle theme');
  };

  return (
    <header className="border-b border-border bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={accelerationLogo} 
                alt="Acceleration Consortium Logo" 
                className="h-10 w-auto object-contain"
              />
              <div>
                <h1 className="text-xl font-bold gradient-text">PyPoe</h1>
                <p className="text-xs text-muted-foreground">AI Interface</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={isConnected ? "default" : "secondary"} 
                className={`gap-1 ${isConnected ? 'bg-green-600 hover:bg-green-700' : 'bg-muted text-muted-foreground'}`}
              >
                {isConnected ? (
                  <Zap className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              {isConnected && (
                <div className="text-xs text-muted-foreground">
                  <div>{ipAddresses.primary}</div>
                  <div>{ipAddresses.secondary}</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-primary"
              />
            </div>
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