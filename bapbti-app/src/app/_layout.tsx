import '../global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../components/ui';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
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
  return (
    <>
      <OnboardingGate />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F2F4F6' }, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="g/[code]" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
    </>
  );
}

/**
 * 프로필이 없으면 온보딩으로 보낸다.
 * 초대 링크(/g/CODE)만 예외 — 링크로 들어온 사람은 먼저 그 판에 참여시키고, 프로필은 그 뒤에 만든다.
 * 링크 → 참여 → 프로필 → 링크 의 고리에서 참여가 앞에 와야 30초 안에 끝난다.
 */
function OnboardingGate() {
  const profile = useProfile();
  const router = useRouter();
  const segments = useSegments();
  const first = segments[0] as string | undefined;

  useEffect(() => {
    if (profile.isLoading || profile.isError) return;
    const needs = !profile.data?.display_name;
    const exempt = first === 'g' || first === 'onboarding';
    if (needs && !exempt) router.replace('/onboarding');
  }, [profile.isLoading, profile.isError, profile.data?.display_name, first, router]);

  return null;
}
