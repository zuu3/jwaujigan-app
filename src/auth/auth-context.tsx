import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { apiPost } from '@/api/client';

const TOKEN_KEY = 'jwaujigan.mobile.token';
const USER_KEY = 'jwaujigan.mobile.user';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  district?: string | null;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isBootstrapping: boolean;
  signInWithGoogleToken: (tokens: { idToken?: string; accessToken?: string }) => Promise<void>;
  signInWithDeepLink: (params: { token: string; user: AuthUser }) => Promise<void>;
  setDevelopmentToken: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    Promise.all([SecureStore.getItemAsync(TOKEN_KEY), SecureStore.getItemAsync(USER_KEY)])
      .then(([storedToken, storedUser]) => {
        setTokenState(storedToken);
        setUserState(storedUser ? JSON.parse(storedUser) as AuthUser : null);
      })
      .finally(() => setIsBootstrapping(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    isBootstrapping,
    async signInWithGoogleToken(tokens) {
      const response = await apiPost<AuthResponse>('/api/auth/mobile/google', tokens);
      await SecureStore.setItemAsync(TOKEN_KEY, response.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));
      setTokenState(response.token);
      setUserState(response.user);
    },
    async signInWithDeepLink({ token, user }: { token: string; user: AuthUser }) {
      queryClient.clear();
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      setTokenState(token);
      setUserState(user);
    },
    async setDevelopmentToken() {
      const nextUser = { id: 'development', email: 'dev@local', name: '개발 사용자', image: null, district: null };
      const nextToken = 'development-mobile-token';
      await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser));
      setTokenState(nextToken);
      setUserState(nextUser);
    },
    async signOut() {
      queryClient.clear();
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      setTokenState(null);
      setUserState(null);
    },
  }), [isBootstrapping, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
