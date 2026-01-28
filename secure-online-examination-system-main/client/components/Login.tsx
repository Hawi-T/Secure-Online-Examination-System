
import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const user = await api.login(username, password);
      onLogin(user);
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-navy p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">SecureExam</h1>
          <p className="text-slate-300">Login to access the exam portal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium border border-red-200">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-navy focus:border-transparent transition-all outline-none"
              placeholder="e.g. admin_01 or student_smith"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-navy focus:border-transparent transition-all outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="pt-2 text-[11px] text-slate-400 italic">
            * Use 'admin' in username for Admin view, any other for Student.
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-navy hover:bg-navy-dark text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Login Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
