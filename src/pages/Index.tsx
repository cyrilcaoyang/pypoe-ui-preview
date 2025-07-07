import { useState } from 'react';
import { Header } from '@/components/pypoe-ui/Header';
import { Sidebar } from '@/components/pypoe-ui/Sidebar';
import { ChatInterface } from '@/components/pypoe-ui/ChatInterface';

const Index = () => {
  const [chatMode, setChatMode] = useState('chatbot');

  return (
    <div className="min-h-screen bg-gradient-bg">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar chatMode={chatMode} />
        <main className="flex-1">
          <ChatInterface chatMode={chatMode} onChatModeChange={setChatMode} />
        </main>
      </div>
    </div>
  );
};

export default Index;
