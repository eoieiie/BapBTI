// 룰렛에 올라갈 후보를 고르는 규칙 — 화면이 휠을 그릴 때 쓴다.
// 거부권 판정과 표 집계는 서버(supabase/migrations/0004_rpc.sql)에만 있다.
// 복제본을 두면 조용히 어긋나므로, 화면이 실제로 쓰는 이 함수 하나만 남긴다.

export interface CandidateLike {
  food_id: string;
  vetoed_by: string | null;
}
export interface VoteLike {
  food_id: string;
}

/**
 * 룰렛에 올라가는 food_id 목록. 거부권 없고 1표 이상.
 * 아무도 안 찍었으면 거부권 없는 전부. (0표 후보가 뽑히면 "게임이 골랐어" 알리바이가 안 먹힌다 — DECISIONS #7)
 * 서버 spin_roulette 와 같은 규칙이지만, 어긋나도 화면이 깨지지 않게 호출 쪽에서 당첨 후보를 보정한다.
 */
export function roulettePool(candidates: readonly CandidateLike[], votes: readonly VoteLike[]): string[] {
  const voted = new Set(votes.map((v) => v.food_id));
  const eligible = candidates.filter((c) => c.vetoed_by === null).map((c) => c.food_id);
  const withVotes = eligible.filter((id) => voted.has(id));
  return withVotes.length > 0 ? withVotes : eligible;
}
