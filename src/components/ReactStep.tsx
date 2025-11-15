import React from 'react';
import { Brain, Cog, Eye, CheckCircle } from 'lucide-react';
import { ReactStep } from '../types';

interface ReactStepComponentProps {
  step: ReactStep;
  isLatest: boolean;
}

export const ReactStepComponent: React.FC<ReactStepComponentProps> = ({ step, isLatest }) => {
  const getStepIcon = (phase: string) => {
    switch (phase) {
      case 'THOUGHT':
        return <Brain className="w-4 h-4" />;
      case 'ACTION':
        return <Cog className="w-4 h-4" />;
      case 'OBSERVATION':
        return <Eye className="w-4 h-4" />;
      case 'FINAL_ANSWER':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getStepColor = (phase: string) => {
    switch (phase) {
      case 'THOUGHT':
        return 'border-blue-400 bg-blue-900/30';
      case 'ACTION':
        return 'border-yellow-400 bg-yellow-900/30';
      case 'OBSERVATION':
        return 'border-green-400 bg-green-900/30';
      case 'FINAL_ANSWER':
        return 'border-purple-400 bg-purple-900/30';
      default:
        return 'border-gray-400 bg-gray-900/30';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'THOUGHT':
        return 'Thinking';
      case 'ACTION':
        return 'Acting';
      case 'OBSERVATION':
        return 'Observing';
      case 'FINAL_ANSWER':
        return 'Final Answer';
      default:
        return phase;
    }
  };

  return (
    <div
      className={`thought-step p-3 rounded-lg border-l-4 ${getStepColor(step.phase)} ${
        isLatest ? 'animate-pulse-slow' : ''
      }`}
    >
      <div className="flex items-center space-x-2 mb-2">
        <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
          step.phase === 'THOUGHT' ? 'bg-blue-500' :
          step.phase === 'ACTION' ? 'bg-yellow-500' :
          step.phase === 'OBSERVATION' ? 'bg-green-500' :
          'bg-purple-500'
        }`}>
          {getStepIcon(step.phase)}
        </div>
        <span className="text-sm font-medium text-gray-200">
          Step {step.step}: {getPhaseLabel(step.phase)}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(step.timestamp).toLocaleTimeString()}
        </span>
      </div>
      
      <div className="text-sm text-gray-300 leading-relaxed">
        {step.content.replace(/^[💭🔧👁️✅]\s*/, '').trim()}
      </div>

      {step.details && (
        <div className="mt-2 text-xs text-gray-400">
          {step.details.tool_name && (
            <div>Tool: <span className="font-mono">{step.details.tool_name}</span></div>
          )}
          {step.details.react_pattern && (
            <div>Pattern: {step.details.react_pattern}</div>
          )}
        </div>
      )}
    </div>
  );
};

interface TypingIndicatorProps {
  phase?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ phase = 'thinking' }) => {
  return (
    <div className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg border-l-4 border-blue-400">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500">
        <Brain className="w-4 h-4 animate-pulse" />
      </div>
      <span className="text-sm text-gray-300">
        AI is {phase}
      </span>
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};
