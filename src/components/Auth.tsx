import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Eye, EyeOff } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!userId.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setIsSubmitting(false);
      return;
    }

    const success = await login(userId.trim(), password);
    if (!success) {
      setError('Invalid username or password');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-600 rounded-full">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Banking Bot
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your username"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-400">
              <p className="mb-2">Demo Accounts:</p>
              <div className="space-y-1 text-xs">
                <p><span className="font-mono bg-gray-800 px-2 py-1 rounded">john_doe</span> / <span className="font-mono bg-gray-800 px-2 py-1 rounded">password123</span></p>
                <p><span className="font-mono bg-gray-800 px-2 py-1 rounded">jane_smith</span> / <span className="font-mono bg-gray-800 px-2 py-1 rounded">password123</span></p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

interface UserMenuProps {
  user: any;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="hidden md:block text-sm font-medium">
          {user.first_name} {user.last_name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
              <p className="font-medium">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
