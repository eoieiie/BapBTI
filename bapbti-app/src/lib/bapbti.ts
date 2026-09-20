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
