import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { authAPI } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Set up periodic token refresh
  useEffect(() => {
    if (!user) return;

    const checkTokenExpiry = () => {
      const tokenExpiry = localStorage.getItem('token_expiry');
      if (tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry);
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;
        
        // Refresh token if it expires in less than 10 minutes
        if (timeUntilExpiry < 10 * 60 * 1000 && timeUntilExpiry > 0) {
          console.log('🔄 Proactively refreshing token (expires in ' + Math.round(timeUntilExpiry / 60000) + ' minutes)');
          authAPI.refreshToken().catch((error) => {
            console.error('Proactive token refresh failed:', error);
            logout();
          });
        }
      }
    };

    // Check immediately
    checkTokenExpiry();
    
    // Check every 2 minutes
    const intervalId = setInterval(checkTokenExpiry, 2 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [user]);

  const login = async (user_id: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { user: userData } = await authAPI.login(user_id, password);
      setUser(userData);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
