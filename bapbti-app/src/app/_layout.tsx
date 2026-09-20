import '../global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { Button } from '../components/ui';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { t } from '../lib/i18n';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center bg-bg px-8">
      <Text className="text-[20px] font-bold text-ink">{t('common.error')}</Text>
      <Text className="mt-2 text-center text-sub">{error.message}</Text>
      <Button label={t('common.retry')} className="mt-6 w-40" onPress={() => retry()} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Gate />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// 익명 세션이 잡히기 전엔 아무 화면도 안 띄운다 (RLS 가 auth.uid() 를 본다)
function Gate() {
  const { loading, error } = useAuth();
  if (loading) return null;
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-8">
        <Text className="text-[18px] font-bold text-ink">{t('common.error')}</Text>
        <Text className="mt-2 text-center text-sub">{error}</Text>
        <Text className="mt-4 text-center text-[13px] text-sub">Supabase → Authentication → Anonymous sign-ins</Text>
      </View>
    );
  }
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F2F4F6' } }} />;
}
