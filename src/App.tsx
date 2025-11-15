import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm, UserMenu } from './components/Auth';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatWindow } from './components/ChatWindow';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Bot } from 'lucide-react';

interface MainAppContentProps {}

const MainAppContent: React.FC<MainAppContentProps> = () => {
  const { user, logout, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [refreshThreads, setRefreshThreads] = useState(0);

  const handleNewChat = () => {
    setCurrentThreadId(null);
  };

  const handleThreadSelect = (threadId: string) => {
    setCurrentThreadId(threadId);
  };

  const handleNewMessage = (threadId?: string) => {
    // If this is a new thread (from new chat), update the current thread ID
    if (threadId && !currentThreadId) {
      setCurrentThreadId(threadId);
    }
    
    // Trigger a refresh of the thread list to show new/updated threads
    setRefreshThreads(prev => prev + 1);
  };

  const handleThreadsChanged = () => {
    // Handle when threads are added/deleted - refresh the sidebar
    setRefreshThreads(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-400">
          <Bot className="w-8 h-8 animate-pulse" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="h-screen bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentThreadId={currentThreadId}
        onThreadSelect={handleThreadSelect}
        onNewChat={handleNewChat}
        onThreadsChanged={handleThreadsChanged}
        refreshTrigger={refreshThreads}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Banking Bot</h1>
                <p className="text-sm text-gray-400">
                  {currentThreadId ? 'Active Conversation' : 'Start a new conversation'}
                </p>
              </div>
            </div>
            
            <UserMenu user={user} onLogout={logout} />
          </div>
        </header>

        {/* Chat Window */}
        <ChatWindow
          currentThreadId={currentThreadId}
          onNewMessage={handleNewMessage}
        />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
