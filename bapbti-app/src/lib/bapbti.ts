// 밥비티아이 타입 — v1은 축 하나: 반복(권위자) ↔ 탐험(도감). DECISIONS #9
// 재료: 최근 n끼(최신순)의 food_id. 비율 = 고유 음식 수 / 끼니 수.

export type BapType = 'authority' | 'explorer' | 'balanced' | 'unknown';

export const MIN_MEALS_FOR_TYPE = 3;
export const RECENT_WINDOW = 10;

export function explorationRatio(recentFoodIds: readonly string[]): number | null {
  const window = recentFoodIds.slice(0, RECENT_WINDOW);
  if (window.length < MIN_MEALS_FOR_TYPE) return null;
  return new Set(window).size / window.length;
}

export function bapType(ratio: number | null): BapType {
  if (ratio === null) return 'unknown';
  if (ratio >= 0.7) return 'explorer';
  if (ratio <= 0.4) return 'authority';
  return 'balanced';
}

/** 가장 많이 먹은 음식 (권위자 라벨용). 동률이면 먼저 나온 것. */
export function topFood(counts: readonly { food_id: string; n: number }[]): { food_id: string; n: number } | null {
  let best: { food_id: string; n: number } | null = null;
  for (const c of counts) if (!best || c.n > best.n) best = c;
  return best;
}

/**
 * 레벨 — 총 끼니 수. 삼각수(1,3,6,10,15…)라 처음엔 금방 오르고 뒤로 갈수록 느려진다.
 * 자랑거리는 레벨 숫자보다 "무엇을 몇 번 먹었나"라서, 레벨은 한 줄만 차지한다.
 */
export function level(total: number): { level: number; into: number; need: number } {
  let lv = 1;
  while ((lv * (lv + 1)) / 2 <= total) lv++;
  const base = ((lv - 1) * lv) / 2;
  const next = (lv * (lv + 1)) / 2;
  return { level: lv, into: total - base, need: next - base };
}
