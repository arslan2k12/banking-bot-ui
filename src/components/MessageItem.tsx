import React from 'react';
import { User, Bot } from 'lucide-react';
import { ChatMessage } from '../types/index';
import { EvaluationSection } from './EvaluationSection';

interface MessageItemProps {
  message: ChatMessage;
  isLastAssistantMessage: boolean;
  answerComplete: boolean;
  currentEvaluation: any;
  formatMessageContent: (content: string) => string;
}

export const MessageItem: React.FC<MessageItemProps> = React.memo(({
  message,
  isLastAssistantMessage,
  answerComplete,
  currentEvaluation,
  formatMessageContent,
}) => {
  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-3xl ${
          message.role === 'user'
            ? 'bg-blue-600 text-white rounded-l-2xl rounded-tr-2xl'
            : 'bg-gray-700 text-gray-100 rounded-r-2xl rounded-tl-2xl'
        } p-4 message-appear`}
      >
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            message.role === 'user' ? 'bg-blue-500' : 'bg-gray-600'
          }`}>
            {message.role === 'user' ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1">
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: formatMessageContent(message.content),
              }}
            />
            <div className="text-xs opacity-70 mt-2">
              {message.timestamp.toLocaleTimeString()}
            </div>
            
            {/* Show evaluation section only for the most recent assistant message */}
            {message.role === 'assistant' && isLastAssistantMessage && (
              <EvaluationSection
                answerComplete={answerComplete}
                evaluationData={currentEvaluation}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
