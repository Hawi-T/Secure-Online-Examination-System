
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import ExamRoom from './components/ExamRoom';
import Header from './components/Header';
import { User, UserRole } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionUser = await api.checkSession();
        if (sessionUser) {
          setUser(sessionUser);
          localStorage.setItem('exam_user', JSON.stringify(sessionUser));
        } else {
          // Fallback to local storage if API check fails but user exists locally (might be risky, but good for persistence)
          const savedUser = localStorage.getItem('exam_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (err) {
        console.error("Session check failed", err);
      } finally {
        setIsInitializing(false);
      }
    };
    checkSession();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('exam_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error("Logout failed", err);
    }
    setUser(null);
    localStorage.removeItem('exam_user');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mb-4"></div>
          <p className="text-slate-500 font-medium">Initializing Secure Session...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        {user && <Header user={user} onLogout={handleLogout} />}
        <main className="flex-grow">
          <Routes>
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
            />
            
            <Route 
              path="/" 
              element={
                user ? (
                  user.role === UserRole.ADMIN ? (
                    <AdminDashboard />
                  ) : (
                    <StudentDashboard />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />

            <Route 
              path="/exam/:examId" 
              element={
                user && user.role === UserRole.STUDENT ? (
                  <ExamRoom />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
