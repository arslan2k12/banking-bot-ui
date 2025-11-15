import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Loader2, User, Bot } from 'lucide-react';
import { ChatMessage, ReactStep, StreamChunk } from '../types/index';
import { chatAPI } from '../services/api';
import { ReactStepComponent, TypingIndicator } from './ReactStep';
import { MessageItem } from './MessageItem';

interface ChatWindowProps {
  currentThreadId: string | null;
  onNewMessage: (threadId?: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  currentThreadId,
  onNewMessage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentReactSteps, setCurrentReactSteps] = useState<ReactStep[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [answerComplete, setAnswerComplete] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<(() => void) | null>(null);
  const [isNewThread, setIsNewThread] = useState<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentReactSteps]);

  useEffect(() => {
    if (currentThreadId) {
      // Only load history if this is not a newly created thread
      if (!isNewThread) {
        loadChatHistory();
      } else {
        console.log('🆕 Skipping history load for new thread:', currentThreadId);
        setIsNewThread(false); // Reset flag after first use
      }
    } else {
      setMessages([]);
      setCurrentReactSteps([]);
    }
  }, [currentThreadId]);

  const loadChatHistory = async () => {
    if (!currentThreadId) return;
    
    try {
      setIsLoading(true);
      const history = await chatAPI.getChatHistory(currentThreadId);
      
      const chatMessages: ChatMessage[] = history.map((item: any) => [
        {
          id: `${item.id}-user`,
          content: item.user_query,
          role: 'user' as const,
          timestamp: new Date(item.created_at),
          chat_thread_id: currentThreadId,
        },
        {
          id: `${item.id}-assistant`,
          content: item.bot_response,
          role: 'assistant' as const,
          timestamp: new Date(item.created_at),
          chat_thread_id: currentThreadId,
        },
      ]).flat();
      
      setMessages(prev => {
        // Only replace if we don't have messages or if this is genuinely loading history
        if (prev.length === 0) {
          console.log('📚 Loading chat history:', chatMessages.length, 'messages');
          return chatMessages;
        } else {
          console.log('⚠️ Skipping history load - messages already exist:', prev.length);
          return prev;
        }
      });
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    const message = inputValue.trim();
    const threadId = currentThreadId || `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🧵 Thread management:', {
      currentThreadId,
      generatedThreadId: threadId,
      isNewThread: !currentThreadId
    });
    
    // If this is a new thread, notify parent component
    if (!currentThreadId) {
      console.log('🆕 Creating new thread:', threadId);
      setIsNewThread(true); // Mark as new thread to prevent history loading
      onNewMessage(threadId);
    } else {
      console.log('📞 Continuing conversation in thread:', threadId);
    }
    
    // Reset evaluation state for new conversation
    setCurrentEvaluation(null);
    setAnswerComplete(false);
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: message,
      role: 'user',
      timestamp: new Date(),
      chat_thread_id: threadId,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);
    setAnswerComplete(false);  // Reset answer completion flag
    setCurrentReactSteps([]);

    // Prepare assistant message
    let assistantMessage: ChatMessage = {
      id: `assistant_${Date.now()}`,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      chat_thread_id: threadId,
      react_steps: [],
    };

    let finalContent = '';

    const handleChunk = (chunk: StreamChunk) => {
      console.log('🔄 Processing chunk:', chunk.type, chunk);
      

      
      // Handle original ReAct streaming format (preserve all original functionality)
      if (chunk.type === 'react_step') {
        const reactStep: ReactStep = {
          type: 'react_step',
          step: chunk.step!,
          phase: chunk.phase as 'THOUGHT' | 'ACTION' | 'OBSERVATION' | 'FINAL_ANSWER',
          content: chunk.content || '',
          details: chunk.details,
          timestamp: chunk.timestamp || new Date().toISOString(),
        };

        setCurrentReactSteps(prev => {
          const updated = [...prev];
          const existingIndex = updated.findIndex(step => step.step === reactStep.step);
          
          if (existingIndex >= 0) {
            updated[existingIndex] = reactStep;
          } else {
            updated.push(reactStep);
          }
          
          return updated;
        });

        // If it's a FINAL_ANSWER, extract the actual response content and add final message IMMEDIATELY
        if (chunk.phase === 'FINAL_ANSWER' && chunk.details?.final_answer) {
          finalContent = chunk.details.final_answer;
          
          // Add the final assistant message immediately and stop streaming UI
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = finalContent;
              lastMessage.react_steps = currentReactSteps; // Add react steps to final message
            } else {
              assistantMessage.content = finalContent;
              assistantMessage.react_steps = currentReactSteps;
              updated.push(assistantMessage);
            }
            
            return updated;
          });
          
          // Clear streaming state immediately after final answer
          setIsStreaming(false);
          setAnswerComplete(true);  // Mark answer as complete, UI can stop waiting
          setCurrentReactSteps([]);
        }
      }
      else if (chunk.type === 'reasoning_token') {
        // Update the current reasoning step with new tokens
        setCurrentReactSteps(prev => {
          const updated = [...prev];
          const currentStepIndex = updated.findIndex(step => step.step === chunk.step);
          
          if (currentStepIndex >= 0) {
            const currentStep = updated[currentStepIndex];
            if (currentStep.phase === 'THOUGHT') {
              // Append reasoning tokens to show live thinking
              currentStep.reasoningContent = (currentStep.reasoningContent || '') + (chunk.content || '');
            }
          }
          
          return updated;
        });
      }
      // Handle evaluation completion (NEW functionality) - runs in background, no UI changes
      else if (chunk.type === 'evaluation_complete') {
        console.log('� Evaluation completed:', chunk.evaluation);
        
        // Simple approach: just store in separate state
        setCurrentEvaluation(chunk.evaluation);
      }
      // Handle completion event
      else if (chunk.type === 'completion') {
        console.log('� Chat completion received:', chunk);
        // The completion event already has evaluation_summary - use it
        if (chunk.evaluation_summary) {
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.evaluation = chunk.evaluation_summary;
            }
            
            return updated;
          });
        }
      } 
      // Legacy token streaming
      else if (chunk.type === 'llm_token' && chunk.content) {
        finalContent += chunk.content;
        
        setMessages(prev => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = finalContent;
          } else {
            assistantMessage.content = finalContent;
            updated.push(assistantMessage);
          }
          
          return updated;
        });
      }
    };

    const handleComplete = () => {
      console.log('🏁 Stream completed, finalContent:', finalContent);
      setIsStreaming(false);
      
      // If we don't have a final answer yet, try to extract from the last thought
      if (!finalContent && currentReactSteps.length > 0) {
        const lastThought = currentReactSteps
          .filter(step => step.phase === 'THOUGHT')
          .pop();
        
        if (lastThought?.details?.full_thought) {
          const fallbackAnswer = lastThought.details.full_thought
            .replace(/^💭\s*/, '') // Remove emoji
            .trim();
          
          if (fallbackAnswer) {
            console.log('🔧 Using fallback answer from last thought:', fallbackAnswer);
            finalContent = fallbackAnswer;
            
            setMessages(prev => {
              const updated = [...prev];
              const lastMessage = updated[updated.length - 1];
              
              if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content = finalContent;
                lastMessage.react_steps = currentReactSteps;
              } else {
                assistantMessage.content = finalContent;
                assistantMessage.react_steps = currentReactSteps;
                updated.push(assistantMessage);
              }
              
              return updated;
            });
          }
        }
      } else {
        // Update the final message with react steps
        setMessages(prev => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.react_steps = currentReactSteps;
          }
          
          return updated;
        });
      }
      
      setCurrentReactSteps([]);
      onNewMessage(threadId);
    };

    const handleError = (error: Error) => {
      console.error('Streaming error:', error);
      setIsStreaming(false);
      setCurrentReactSteps([]);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        chat_thread_id: threadId,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    };

    // Start streaming
    abortControllerRef.current = chatAPI.streamMessage(
      message,
      threadId,
      handleChunk,
      handleComplete,
      handleError
    );
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setCurrentReactSteps([]);
  };

  const formatMessageContent = useCallback((content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  }, []);

  // Memoize assistant messages to prevent unnecessary recalculations
  const assistantMessages = useMemo(() => 
    messages.filter(m => m.role === 'assistant'), 
    [messages]
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading chat history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
        {messages.length === 0 && !currentThreadId ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">
                Welcome to Banking Bot
              </h3>
              <p className="text-gray-500 max-w-md">
                I can help you check account balances, view transactions, get credit card information, and search bank documents. Start a conversation below!
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isLastAssistantMessage={
                  message.role === 'assistant' && 
                  assistantMessages.indexOf(message) === assistantMessages.length - 1
                }
                answerComplete={answerComplete}
                currentEvaluation={currentEvaluation}
                formatMessageContent={formatMessageContent}
              />
            ))}

            {/* Current ReAct Steps */}
            {isStreaming && !answerComplete && currentReactSteps.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-3xl bg-gray-800 rounded-r-2xl rounded-tl-2xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-2">
                      {currentReactSteps.map((step, index) => (
                        <ReactStepComponent
                          key={`${step.step}-${step.phase}`}
                          step={step}
                          isLatest={index === currentReactSteps.length - 1}
                        />
                      ))}
                      <TypingIndicator />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Typing indicator when starting */}
            {isStreaming && !answerComplete && currentReactSteps.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-3xl bg-gray-800 rounded-r-2xl rounded-tl-2xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <TypingIndicator />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-700 p-4 bg-gray-900">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me about your banking needs..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 chat-input"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>  
  );
};
