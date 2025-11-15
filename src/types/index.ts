export interface User {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  chat_thread_id?: string;
  react_steps?: ReactStep[];
  evaluation?: EvaluationSummary;
}

export interface EvaluationSummary {
  overall_score: number;
  confidence_level: string;
  summary: string;
  criteria_scores: Array<{
    criterion: string;
    score: number;
    reasoning: string;
  }>;
  strengths: string[];
  weaknesses: string[];
}

export interface ReactStep {
  type: 'react_step';
  step: number;
  phase: 'THOUGHT' | 'ACTION' | 'OBSERVATION' | 'FINAL_ANSWER';
  content: string;
  details?: {
    tool_name?: string;
    arguments?: any;
    result_preview?: string;
    react_pattern?: string;
    full_thought?: string;
  };
  timestamp: string;
  reasoningContent?: string; // For live reasoning tokens
}

export interface ChatThread {
  chat_thread_id: string;
  last_message: string;
  last_activity: Date;
  message_count: number;
}

export interface AuthContextType {
  user: User | null;
  login: (user_id: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface StreamChunk {
  type: 'stream_start' | 'react_step' | 'llm_token' | 'reasoning_token' | 'stream_complete' | 'completion' | 'response_chunk' | 'evaluation_complete';
  content?: string;
  step?: number;
  phase?: string;
  details?: any;
  user_id?: string;
  chat_thread_id?: string;
  timestamp?: string;
  evaluation?: EvaluationSummary;
  evaluation_summary?: EvaluationSummary;
}
