import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { AuthProvider } from '@/auth/auth-context';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 30, retry: 1 } },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: colors.white } }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
