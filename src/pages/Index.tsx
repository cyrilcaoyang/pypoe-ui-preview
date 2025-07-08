import { useState, useEffect } from 'react';
import { Header } from '@/components/pypoe-ui/Header';
import { Sidebar } from '@/components/pypoe-ui/Sidebar';
import { ChatInterface } from '@/components/pypoe-ui/ChatInterface';
import { pyPoeAPI } from '@/services/api';

const Index = () => {
  const [chatMode, setChatMode] = useState('chatbot');
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [sidebarKey, setSidebarKey] = useState(0); // Force sidebar refresh

  // Handle conversation selection from sidebar
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  // Handle new conversation creation
  const handleNewConversation = () => {
    // The ChatInterface component handles showing the new conversation dialog
    setSelectedConversationId(undefined);
  };

  // Handle conversation change (e.g., after creating a new one)
  const handleConversationChange = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    // Refresh sidebar to show the new conversation
    setSidebarKey(prev => prev + 1);
  };

  // Test backend connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const health = await pyPoeAPI.getHealthStatus();
        console.log('PyPoe backend status:', health);
      } catch (error) {
        console.warn('PyPoe backend connection failed:', error);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-bg">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar 
          key={sidebarKey}
          chatMode={chatMode} 
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          selectedConversationId={selectedConversationId}
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
    </div>
  );
};

export default Index;
