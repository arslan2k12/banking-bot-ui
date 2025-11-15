import axios from 'axios';
import { User, ChatThread } from '../types';

const API_BASE_URL = 'http://localhost:2024';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken: string | null = localStorage.getItem('auth_token');
let tokenExpiryTime: number | null = null;
let refreshPromise: Promise<string> | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Decode token to get expiry time
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      tokenExpiryTime = payload.exp * 1000; // Convert to milliseconds
      localStorage.setItem('token_expiry', tokenExpiryTime.toString());
    } catch (error) {
      console.warn('Failed to decode token:', error);
    }
  } else {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_expiry');
    tokenExpiryTime = null;
    delete api.defaults.headers.common['Authorization'];
  }
};

// Initialize token on app load
if (authToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  const storedExpiry = localStorage.getItem('token_expiry');
  if (storedExpiry) {
    tokenExpiryTime = parseInt(storedExpiry);
  }
}

// Token refresh function
const refreshToken = async (): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      console.log('🔄 Refreshing token...');
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const { access_token } = response.data;
      setAuthToken(access_token);
      console.log('✅ Token refreshed successfully');
      return access_token;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      // If refresh fails, clear token and redirect to login
      setAuthToken(null);
      window.location.href = '/';
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Check if token needs refresh (refresh 5 minutes before expiry)
const shouldRefreshToken = (): boolean => {
  if (!tokenExpiryTime) return false;
  const now = Date.now();
  const timeUntilExpiry = tokenExpiryTime - now;
  return timeUntilExpiry < 5 * 60 * 1000; // Refresh if less than 5 minutes remaining
};

// Axios request interceptor to refresh token if needed
api.interceptors.request.use(async (config) => {
  if (authToken && shouldRefreshToken()) {
    try {
      await refreshToken();
    } catch (error) {
      console.error('Failed to refresh token in request interceptor:', error);
    }
  }
  return config;
});

// Axios response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await refreshToken();
        // Retry the original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${authToken}`;
        return api.request(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed, redirecting to login');
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (user_id: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/login', { user_id, password });
    const { access_token } = response.data;
    setAuthToken(access_token);
    
    // Get user profile after successful login
    const userResponse = await api.get('/auth/me');
    return {
      user: userResponse.data,
      token: access_token,
    };
  },

  refreshToken: async (): Promise<string> => {
    return refreshToken();
  },

  logout: () => {
    setAuthToken(null);
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      // If /auth/me doesn't exist, try to extract user info from token
      if (authToken) {
        try {
          const payload = JSON.parse(atob(authToken.split('.')[1]));
          return {
            id: payload.sub,
            user_id: payload.sub,
            first_name: payload.sub.split('_')[0] || 'User',
            last_name: payload.sub.split('_')[1] || '',
            email: `${payload.sub}@example.com`,
          };
        } catch (tokenError) {
          throw new Error('Invalid token');
        }
      }
      throw error;
    }
  },
};

// Chat API
export const chatAPI = {
  sendMessage: async (message: string, chat_thread_id?: string) => {
    const response = await api.post('/chat/message', {
      message,
      chat_thread_id,
    });
    return response.data;
  },

  streamMessage: (
    message: string,
    chat_thread_id: string,
    onChunk: (chunk: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): (() => void) => {
    const controller = new AbortController();
    
    const makeStreamRequest = async (isRetry = false) => {
      // Refresh token if needed before streaming
      if (!isRetry && shouldRefreshToken()) {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Failed to refresh token before streaming:', error);
          onError(new Error('Authentication failed'));
          return;
        }
      }
      
      console.log('🚀 Starting stream request with token:', authToken ? 'Present' : 'Missing');
      console.log('🌐 Request URL:', `${API_BASE_URL}/chat/stream`);
      console.log('📝 Request payload:', { message, chat_thread_id });
      console.log('🧵 Using thread ID:', chat_thread_id);
      
      fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          message,
          chat_thread_id,
        }),
        signal: controller.signal,
      })
      .then((response) => {
        console.log('📡 Response received:', response.status, response.statusText);
        
        if (!response.ok) {
          console.error('❌ HTTP error:', response.status, response.statusText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body?.getReader();
        if (!reader) {
          console.error('❌ No reader available');
          throw new Error('No reader available');
        }

        console.log('✅ Starting to read stream...');
        const decoder = new TextDecoder();
        
        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                onComplete();
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    console.log('📦 Received chunk:', data);
                    onChunk(data);
                  } catch (e) {
                    console.warn('Failed to parse SSE data:', line);
                  }
                }
              }
            }
          } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
              onError(error);
            }
          }
        };

        readStream();
      })
      .catch(async (error) => {
        if (error.name === 'AbortError') return;
        
        // Handle 401 errors with token refresh
        if (!isRetry && error.message.includes('401')) {
          try {
            console.log('🔄 Attempting token refresh due to 401 error');
            await refreshToken();
            makeStreamRequest(true); // Retry with new token
            return;
          } catch (refreshError) {
            console.error('Token refresh failed during streaming:', refreshError);
          }
        }
        
        onError(error);
      });
    };

    // Start the request
    makeStreamRequest();

    // Return abort function
    return () => controller.abort();
  },

  getChatHistory: async (chat_thread_id: string, limit?: number) => {
    const response = await api.get('/chat/history', {
      params: { chat_thread_id, limit },
    });
    return response.data;
  },

  getChatThreads: async (): Promise<ChatThread[]> => {
    const response = await api.get('/chat/threads');
    return response.data.threads;
  },

  deleteThread: async (threadId: string) => {
    const response = await api.delete(`/chat/threads/${threadId}`);
    return response.data;
  },

  deleteAllThreads: async () => {
    const response = await api.delete('/chat/threads');
    return response.data;
  },

  getReactTrace: async () => {
    const response = await api.get('/chat/react-trace');
    return response.data.trace;
  },
};

export default api;
