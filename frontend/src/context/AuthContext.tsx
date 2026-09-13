'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthResponse, LoginRequest, SignupCreateGroupRequest, SignupJoinGroupRequest } from '@/types/api';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthUser {
  memberId: number;
  email: string;
  displayName: string;
  groupId: number;
  groupName: string;
  inviteCode: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signupCreateGroup: (data: SignupCreateGroupRequest) => Promise<void>;
  signupJoinGroup: (data: SignupJoinGroupRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('poolfolio_token');
      const storedUser = localStorage.getItem('poolfolio_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to restore auth from storage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAuthSuccess = (res: AuthResponse) => {
    const authUser: AuthUser = {
      memberId: res.memberId,
      email: res.email,
      displayName: res.displayName,
      groupId: res.groupId,
      groupName: res.groupName,
      inviteCode: res.inviteCode,
      role: res.role,
    };
    setToken(res.token);
    setUser(authUser);
    localStorage.setItem('poolfolio_token', res.token);
    localStorage.setItem('poolfolio_user', JSON.stringify(authUser));
  };

  const login = async (data: LoginRequest) => {
    const res = await api.auth.login(data);
    handleAuthSuccess(res);
    router.push('/dashboard');
  };

  const signupCreateGroup = async (data: SignupCreateGroupRequest) => {
    const res = await api.auth.signupCreateGroup(data);
    handleAuthSuccess(res);
    router.push('/dashboard');
  };

  const signupJoinGroup = async (data: SignupJoinGroupRequest) => {
    const res = await api.auth.signupJoinGroup(data);
    handleAuthSuccess(res);
    router.push('/dashboard');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('poolfolio_token');
    localStorage.removeItem('poolfolio_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signupCreateGroup,
        signupJoinGroup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
