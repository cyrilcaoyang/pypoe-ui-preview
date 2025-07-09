import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Github, Settings, Zap, WifiOff, Sun, Moon } from 'lucide-react';
import accelerationLogo from '@/assets/acceleration-consortium-logo.png';
import lightThemeLogo from '@/assets/light-theme-logo.svg';
import { useState, useEffect } from 'react';
import { pyPoeAPI } from '@/services/api';

export function Header() {
  // Theme state with actual functionality
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [networkInfo, setNetworkInfo] = useState({
    tailscaleConnected: false,
    compsciConnected: false,
    currentIP: '',
    tailscaleIP: '',
    compsciIP: ''
  });

  // Detect network connection
  useEffect(() => {
    const detectNetwork = async () => {
      const hostname = window.location.hostname;
      const port = window.location.port || '5173';
      let currentIP = `${hostname}:${port}`;
      
      // Debug: Log what we're detecting
      console.log('Network Detection:', { hostname, port, currentIP });
      
      let isTailscale = false;
      let isCompsci = false;
      let tailscaleIP = '';
      let compsciIP = '';
      
      // Check if hostname is already an IP address
      if (hostname.startsWith('100.64.')) {
        isTailscale = true;
        tailscaleIP = currentIP;
      } else if (hostname.startsWith('172.31.') || hostname.startsWith('172.32.')) {
        isCompsci = true;
        compsciIP = currentIP;
      } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // When accessing via localhost, get network info from backend
        try {
          const config = await pyPoeAPI.getConfig();
          const networkInterfaces = config.network_interfaces;
          
          console.log('Network interfaces from backend:', networkInterfaces);
          
          // Check Tailscale network
          if (networkInterfaces && networkInterfaces.tailscale) {
            isTailscale = true;
            tailscaleIP = networkInterfaces.tailscale.frontend_url.replace('http://', '');
            console.log(`Tailscale network available at ${networkInterfaces.tailscale.ip}`);
          }
          
          // Check Compsci network
          if (networkInterfaces && networkInterfaces.compsci) {
            isCompsci = true;
            compsciIP = networkInterfaces.compsci.frontend_url.replace('http://', '');
            console.log(`Compsci network available at ${networkInterfaces.compsci.ip}`);
          }
        } catch (error) {
          console.log('Failed to get network info from backend:', error);
          // Fallback: don't show any network badges
        }
      }
      
      // Update display based on what we found
      setNetworkInfo({
        tailscaleConnected: isTailscale,
        compsciConnected: isCompsci,
        currentIP,
        tailscaleIP: tailscaleIP || '',
        compsciIP: compsciIP || ''
      });
      
      console.log('Network Status:', { isTailscale, isCompsci, tailscaleIP, compsciIP });
    };

    detectNetwork();
    
    // Re-check network status periodically
    const interval = setInterval(detectNetwork, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
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
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={isDarkMode ? accelerationLogo : lightThemeLogo} 
                alt={isDarkMode ? "Acceleration Consortium Logo" : "Light Theme Logo"} 
                className="h-10 w-auto object-contain"
              />
              <div>
                <h1 className="text-xl font-bold gradient-text">PyPoe</h1>
                <p className="text-xs text-muted-foreground">AI Front-End</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Tailscale Network */}
              <div className="flex items-center gap-2">
                {networkInfo.tailscaleConnected ? (
                  <a 
                    href={`http://${networkInfo.tailscaleIP}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white cursor-pointer">
                      <span className="text-xs font-medium">{networkInfo.tailscaleIP}</span>
                    </Badge>
                  </a>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <WifiOff className="h-3 w-3" />
                    <span className="text-xs">tailscale</span>
                  </div>
                )}
              </div>
              
              {/* Compsci Network */}
              <div className="flex items-center gap-2">
                {networkInfo.compsciConnected ? (
                  <a 
                    href={`http://${networkInfo.compsciIP}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge className="gap-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                      <span className="text-xs font-medium">{networkInfo.compsciIP}</span>
                    </Badge>
                  </a>
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