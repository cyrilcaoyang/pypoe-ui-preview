import { useState, useEffect } from 'react';
import { Header } from '@/components/pypoe-ui/Header';
import { Sidebar } from '@/components/pypoe-ui/Sidebar';
import { ChatInterface } from '@/components/pypoe-ui/ChatInterface';
import Settings from '@/components/Settings';
import { pyPoeAPI } from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Index = () => {
  const [chatMode, setChatMode] = useState('chatbot');
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [sidebarKey, setSidebarKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Handle conversation selection from sidebar
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  // Handle new conversation creation
  const handleNewConversation = () => {
    setSelectedConversationId(undefined);
  };

  // Handle conversation change
  const handleConversationChange = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSidebarKey(prev => prev + 1);
  };

  // Handle settings modal
  const handleSettingsOpen = () => {
    setShowSettings(true);
  };

  // Test backend connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const health = await pyPoeAPI.getHealthStatus();
        console.log('PyPoe backend status:', health);
      } catch (error) {
        console.warn('PyPoe backend connection failed:', error);
        setDebugMode(true); // Enable debug mode if backend fails
      }
    };

    testConnection();
  }, []);

  // Add keyboard shortcut for debug mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDebugMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (debugMode) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: 'white', 
        color: 'black', 
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1>PyPoe Debug Mode</h1>
        <p>Press Ctrl+Shift+D to toggle debug mode</p>
        <button 
          onClick={() => setDebugMode(false)}
          style={{ padding: '10px 20px', margin: '10px 0' }}
        >
          Return to Normal Mode
        </button>
        <div style={{ marginTop: '20px' }}>
          <h3>Component Tests:</h3>
          <div style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
            <h4>Header Component:</h4>
            <Header />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>
      {/* Inline styles as fallback if CSS classes fail */}
      <Header />
      <div className="flex" style={{ height: 'calc(100vh - 4rem)' }}>
        <Sidebar 
          key={sidebarKey}
          chatMode={chatMode} 
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          onSettingsOpen={handleSettingsOpen}
          selectedConversationId={selectedConversationId}
          onConversationChange={handleConversationChange}
          onChatModeChange={setChatMode}
        />
        <main className="flex-1">
          <ChatInterface 
            chatMode={chatMode} 
            onChatModeChange={setChatMode}
            selectedConversationId={selectedConversationId}
            onConversationChange={handleConversationChange}
          />
        </main>
      </div>
      
      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settings & Backend Configuration</DialogTitle>
          </DialogHeader>
          <Settings />
        </DialogContent>
      </Dialog>
      
      {/* Debug helper */}
      <div style={{ 
        position: 'fixed', 
        bottom: '10px', 
        right: '10px', 
        fontSize: '12px',
        color: '#666'
      }}>
        Ctrl+Shift+D for debug
      </div>
    </div>
  );
};

export default Index;
