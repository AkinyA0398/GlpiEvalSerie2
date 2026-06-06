import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── CODE UNIQUE D'ACCÈS BACKOFFICE ─────────────────────────────────────────
export const ADMIN_CODE = 'GLPI-2026';
const AUTH_KEY = 'backoffice_auth';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (code: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === ADMIN_CODE;
  });

  const login = useCallback((code: string): boolean => {
    if (code === ADMIN_CODE) {
      localStorage.setItem(AUTH_KEY, code);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
