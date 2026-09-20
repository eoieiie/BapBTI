import { Platform } from 'react-native';

/** 초대 링크는 항상 웹 주소여야 한다 — 앱 없는 사람이 누른다. */
export function inviteUrl(code: string): string {
  const base =
    process.env.EXPO_PUBLIC_WEB_BASE ??
    (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'https://bapbti.expo.app');
  return `${base.replace(/\/$/, '')}/g/${code}`;
}
