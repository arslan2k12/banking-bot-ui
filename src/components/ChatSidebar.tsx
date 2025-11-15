import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Clock, ChevronLeft, ChevronRight, Trash2, MoreVertical } from 'lucide-react';
import { ChatThread } from '../types';
import { chatAPI } from '../services/api';

interface ChatSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewChat: () => void;
  onThreadsChanged: () => void;
  refreshTrigger?: number;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isCollapsed,
  onToggle,
  currentThreadId,
  onThreadSelect,
  onNewChat,
  onThreadsChanged,
  refreshTrigger,
}) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchThreads = async () => {
      try {
        const data = await chatAPI.getChatThreads();
        if (isMounted) {
          setThreads(data);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load chat threads:', error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchThreads();
    
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const loadThreads = async () => {
    try {
      const data = await chatAPI.getChatThreads();
      setThreads(data);
    } catch (error) {
      console.error('Failed to load chat threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return new Date(date).toLocaleDateString();
  };

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent thread selection
    
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await chatAPI.deleteThread(threadId);
        
        // If the deleted thread was currently selected, clear it
        if (currentThreadId === threadId) {
          onNewChat();
        }
        
        // Refresh the thread list
        loadThreads();
        onThreadsChanged();
      } catch (error) {
        console.error('Failed to delete thread:', error);
        alert('Failed to delete conversation. Please try again.');
      }
    }
  };

  const handleDeleteAllThreads = async () => {
    if (window.confirm('Are you sure you want to delete ALL conversations? This action cannot be undone.')) {
      try {
        await chatAPI.deleteAllThreads();
        
        // Clear current thread and refresh
        onNewChat();
        loadThreads();
        onThreadsChanged();
        setShowDeleteAll(false);
      } catch (error) {
        console.error('Failed to delete all threads:', error);
        alert('Failed to delete all conversations. Please try again.');
      }
    }
  };

  return (
    <div
      className={`bg-gray-900 border-r border-gray-700 flex flex-col h-screen transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Chats
            </h2>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center space-x-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${
            isCollapsed ? 'px-2' : ''
          }`}
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span>New Chat</span>}
        </button>
        
        {/* Delete All Button */}
        {!isCollapsed && threads.length > 0 && (
          <div className="mt-2 relative">
            <button
              onClick={() => setShowDeleteAll(!showDeleteAll)}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete All</span>
            </button>
            
            {showDeleteAll && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg p-2 z-10">
                <p className="text-xs text-gray-300 mb-2">This will delete all conversations permanently.</p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleDeleteAllThreads}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowDeleteAll(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Threads */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
        {isLoading ? (
          <div className="p-4 text-center text-gray-400">
            {!isCollapsed && 'Loading chats...'}
          </div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            {!isCollapsed && 'No conversations yet'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {threads.map((thread) => (
              <div
                key={thread.chat_thread_id}
                className={`relative group rounded-lg transition-colors ${
                  currentThreadId === thread.chat_thread_id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <button
                  onClick={() => onThreadSelect(thread.chat_thread_id)}
                  className={`w-full text-left p-3 transition-colors ${
                    isCollapsed ? 'px-2' : ''
                  }`}
                  title={isCollapsed ? thread.last_message : undefined}
                >
                  {isCollapsed ? (
                    <MessageSquare className="w-4 h-4 mx-auto" />
                  ) : (
                    <div className="pr-8">
                      <div className="text-sm font-medium truncate mb-1">
                        {thread.last_message}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(thread.last_activity)}
                        </span>
                        <span>{thread.message_count} messages</span>
                      </div>
                    </div>
                  )}
                </button>
                
                {/* Delete Button */}
                {!isCollapsed && (
                  <button
                    onClick={(e) => handleDeleteThread(thread.chat_thread_id, e)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-600 hover:bg-opacity-20"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3 text-red-400 hover:text-red-300" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
