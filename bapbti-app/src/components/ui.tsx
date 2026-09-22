// UI 조각 — 브라키 클래스 복제(rounded-[23px] 카드 · px-4 py-3.5 행). 테두리 없음. 디자인 시스템 아님 (DECISIONS #10).
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View, type PressableProps, type TextInputProps, type TextProps, type TextStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColor } from '../lib/foodColor';
import { t } from '../lib/i18n';

export function Screen({ children }: { children: ReactNode }) {
  // 하단 고정 버튼(Bottom)이 키보드 위로 올라오게 — iOS 는 padding, 안드로이드는 OS 가 리사이즈
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView className="flex-1 px-5" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** 모든 화면 공통 헤더 — 높이·위치가 화면마다 같아야 한다. */
export function Header({ title, back, chip, right }: { title: string; back?: boolean; chip?: string; right?: ReactNode }) {
  const router = useRouter();
  // 카톡 링크로 바로 들어오면 쌓인 화면이 없어서 back() 이 아무것도 못 한다 — 그때는 홈으로 보낸다.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View className="mb-3 h-14 flex-row items-center">
      {back && (
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={goBack} className="-ml-2 mr-1 h-10 w-10 items-center justify-center active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </Pressable>
      )}
      <Text className="flex-1 text-[22px] font-bold text-ink" numberOfLines={1}>{title}</Text>
      {chip && (
        <View className="ml-2 rounded-full bg-white px-3 py-1.5">
          <Text className="text-[12px] font-bold text-sub">{chip}</Text>
        </View>
      )}
      {right}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text className="mb-3 mt-2 text-[26px] font-bold text-ink">{children}</Text>;
}

/** 흰 면. 브라키 PlantCard 와 같은 값. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-[23px] bg-white px-5 py-5 ${className}`}>{children}</View>;
}

export function Section({ children }: { children: ReactNode }) {
  return <Text className="mb-2 mt-5 text-[13px] font-bold text-sub">{children}</Text>;
}

export function Hint({ children, className = '', ...rest }: TextProps & { children: ReactNode; className?: string }) {
  return (
    <Text className={`text-[13px] text-sub ${className}`} {...rest}>
      {children}
    </Text>
  );
}

export function Button({
  label, primary, ghost, disabled, loading, className = '', ...rest
}: PressableProps & { label: string; primary?: boolean; ghost?: boolean; loading?: boolean; className?: string }) {
  const off = disabled || loading;
  const look = primary ? 'bg-accent' : ghost ? 'bg-transparent' : 'bg-white';
  const color = primary ? 'text-white' : ghost ? 'text-sub' : 'text-ink';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={off}
      className={`h-[54px] items-center justify-center rounded-2xl ${look} ${off ? 'opacity-40' : 'active:opacity-70'} ${className}`}
      {...rest}>
      {loading ? <ActivityIndicator color={primary ? '#fff' : '#1C1C1E'} /> : <Text className={`text-[17px] font-bold ${color}`}>{label}</Text>}
    </Pressable>
  );
}

/** 텍스트만. 이모지·선 없음. 선택 = 검정 면 하나. */
export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      className={`h-10 justify-center rounded-full px-4 ${on ? 'bg-ink' : 'bg-white'} active:opacity-70`}>
      <Text className={`text-[15px] font-medium ${on ? 'text-white' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  );
}

export function Avatar({ name, dim, size = 40 }: { name: string; dim?: boolean; size?: number }) {
  const initial = name.trim().slice(0, 1).toUpperCase();
  return (
    <View className={`items-center ${dim ? 'opacity-40' : ''}`} style={{ width: size + 12 }}>
      <View style={{ width: size, height: size, borderRadius: size / 2 }} className="items-center justify-center bg-white">
        <Text className="text-[15px] font-bold text-ink">{initial}</Text>
      </View>
      <Text numberOfLines={1} className="mt-1 text-[11px] text-sub">{name}</Text>
    </View>
  );
}

/** 음식 아이콘 — 음식별 고정색 원 하나. 이모지 없음. */
export function FoodDisc({ foodId, size = 40, dim }: { foodId: string; size?: number; dim?: boolean }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: foodColor(foodId) }} className={dim ? 'opacity-30' : ''} />;
}

/** 카드 안의 행 (브라키 SettingsRow). last 가 아니면 아래 구분선. */
export function Row({ children, onPress, last, className = '' }: { children: ReactNode; onPress?: () => void; last?: boolean; className?: string }) {
  const inner = <View className={`flex-row items-center gap-3.5 py-3.5 ${className}`}>{children}</View>;
  return (
    <View>
      {onPress ? <Pressable onPress={onPress} className="active:opacity-70">{inner}</Pressable> : inner}
      {!last && <View className="h-px bg-gray-100" />}
    </View>
  );
}

// 웹 기본 포커스 링 제거 (RN-web 전용 스타일 — RN 타입엔 없어서 캐스팅). 네이티브에선 무시됨.
export const NO_OUTLINE = { outlineStyle: 'none' } as unknown as TextStyle;
export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor="#8E8E93" style={NO_OUTLINE} {...props} className={`h-12 rounded-2xl bg-white px-4 text-[16px] text-ink ${props.className ?? ''}`} />;
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator color="#1C1C1E" />
      <Text className="mt-3 text-sub">{t('common.loading')}</Text>
    </View>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-[18px] font-bold text-ink">{t('common.error')}</Text>
      <Text className="mt-2 text-center text-sub">{message}</Text>
      {onRetry && <Button label={t('common.retry')} className="mt-6 w-40" onPress={onRetry} />}
    </View>
  );
}

/** 하단 고정 주행동 — 모든 화면에서 같은 자리. */
export function Bottom({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View className="pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}>{children}</View>;
}

