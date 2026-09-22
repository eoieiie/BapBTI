// i18n — DECISIONS #11 (v1 필수). 기기 언어가 ko 면 한국어, 아니면 영어.
import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import { en } from '../i18n/en';
import { ko } from '../i18n/ko';

export const i18n = new I18n({ ko, en });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

const device = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = device === 'ko' ? 'ko' : 'en';

export const isKo = () => i18n.locale === 'ko';

/** 음식 이름: 한국어 기기면 한글, 아니면 영어 + 한글 병기 (교환학생이 주문할 때 한글이 필요하다) */
export function foodName(f: { name: string; name_en: string }): string {
  return isKo() ? f.name : `${f.name_en} · ${f.name}`;
}

export const t = i18n.t.bind(i18n);

/** Supabase 에러를 사람 말로. 못 알아보는 건 원문 그대로 둔다(디버깅용). */
export function humanError(message: string): string {
  if (message.includes('coerce the result') || message.includes('0 rows')) return t('common.notMember');
  if (message.includes('not a member')) return t('common.notMember');
  if (message.includes('host only')) return t('session.hostOnly');
  return message;
}
