import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Github, Settings, Zap, WifiOff, Sun, Moon } from 'lucide-react';
import accelerationLogo from '@/assets/acceleration-consortium-logo.png';
import { useState, useEffect } from 'react';

export function Header() {
  // Network connection states - replace with actual state management
  const tailscaleConnected = true;
  const compsciConnected = false;
  const ipAddresses = {
    tailscale: "100.64.254.123:5000",
    compsci: "172.32.45.67:5000"
  };

  // Theme state with actual functionality
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  useEffect(() => {
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
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
              {/* Tailscale Network */}
              <div className="flex items-center gap-2">
                {tailscaleConnected ? (
                  <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                    <span className="text-xs font-medium">{ipAddresses.tailscale}</span>
                  </Badge>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <WifiOff className="h-3 w-3" />
                    <span className="text-xs">tailscale</span>
                  </div>
                )}
              </div>
              
              {/* Compsci Network */}
              <div className="flex items-center gap-2">
                {compsciConnected ? (
                  <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                    <span className="text-xs font-medium">{ipAddresses.compsci}</span>
                  </Badge>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <WifiOff className="h-3 w-3" />
                    <span className="text-xs">compsci</span>
                  </div>
                )}
              </div>
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