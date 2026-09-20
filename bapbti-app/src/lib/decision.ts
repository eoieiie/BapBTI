// 결정 메커니즘 — 표시용 순수 로직. 권위는 supabase/migrations/0004_rpc.sql (compute_veto, cast_vote, spin_roulette).
// 둘이 어긋나면 SQL이 맞다. 여기는 화면에서 "빠질 후보"를 미리 보여주거나 룰렛 풀을 그리는 데 쓴다.

import { isIngredientTag, isRequirementTag, REQUIREMENT_OK } from './tags';

export interface FoodLike {
  id: string;
  tags: readonly string[];
}
export interface RestrictionLike {
  member_id: string;
  food_id: string | null;
  tag: string | null;
}
export interface CandidateLike {
  food_id: string;
  vetoed_by: string | null;
}
export interface VoteLike {
  food_id: string;
}

/** 이 음식에 거부권을 거는 참여자의 member_id. 없으면 null. (SQL compute_veto 와 같은 규칙) */
export function vetoedBy(food: FoodLike, restrictions: readonly RestrictionLike[]): string | null {
  for (const r of restrictions) {
    if (r.food_id && r.food_id === food.id) return r.member_id;
    if (!r.tag) continue;
    if (isIngredientTag(r.tag) && food.tags.includes(r.tag)) return r.member_id;
    if (isRequirementTag(r.tag) && !food.tags.includes(REQUIREMENT_OK[r.tag])) return r.member_id;
  }
  return null;
}

/** food_id → 표 수 */
export function tally(votes: readonly VoteLike[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of votes) out[v.food_id] = (out[v.food_id] ?? 0) + 1;
  return out;
}

/**
 * 룰렛에 올라가는 food_id 목록. 거부권 없고 1표 이상. 아무도 안 찍었으면 거부권 없는 전부.
 * (0표 후보가 뽑히면 "게임이 골랐어" 알리바이가 안 먹혀서 뺀다 — DECISIONS #7)
 */
export function roulettePool(candidates: readonly CandidateLike[], votes: readonly VoteLike[]): string[] {
  const counts = tally(votes);
  const eligible = candidates.filter((c) => c.vetoed_by === null).map((c) => c.food_id);
  const voted = eligible.filter((id) => (counts[id] ?? 0) > 0);
  return voted.length > 0 ? voted : eligible;
}

export const MAX_VOTES_PER_MEMBER = 2;
