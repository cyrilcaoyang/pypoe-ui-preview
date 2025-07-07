import { Header } from '@/components/pypoe-ui/Header';
import { Sidebar } from '@/components/pypoe-ui/Sidebar';
import { ChatInterface } from '@/components/pypoe-ui/ChatInterface';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-bg">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
};

export default Index;
