// 모임 프로필 합산 — 총무가 입맛 조사를 안 해도 되게.
// 누가 무엇을 못 먹는지는 보여주지 않는다. 몇 명인지만 센다 (못 먹는 사람이 매번 밝히지 않게 하는 게 이 앱의 약속).
import { useQuery } from '@tanstack/react-query';

import { AXES, hasTakenQuiz, type Axis, type Axes } from '../lib/quiz';
import { supabase } from '../lib/supabase';
import type { MemberRow } from '../types/db';

export interface GroupProfile {
  /** 태그별로 그걸 못 먹는 사람 수. 많은 순 */
  restrictions: { tag: string; count: number }[];
  /** 음식 이름으로 직접 막은 사람 수 (태그와 별개) */
  foodVetoPeople: number;
  /** 축별로 어느 쪽으로 기우는지. 테스트한 사람만 센다 */
  lean: Record<Axis, { pos: number; neg: number }>;
  quizzed: number;
  claimed: number;
}

export function useGroupProfile(groupId: string | undefined, members: MemberRow[] | undefined) {
  const memberIds = (members ?? []).map((m) => m.id);
  const userIds = (members ?? []).map((m) => m.user_id).filter((u): u is string => !!u);

  return useQuery({
    queryKey: ['groupProfile', groupId, memberIds.join(',')],
    enabled: !!groupId && memberIds.length > 0,
    queryFn: async (): Promise<GroupProfile> => {
      const [rq, pq] = await Promise.all([
        supabase.from('restrictions').select('member_id, tag, food_id').in('member_id', memberIds),
        userIds.length ? supabase.from('profiles').select('user_id, axes').in('user_id', userIds) : Promise.resolve({ data: [], error: null }),
      ]);
      if (rq.error) throw rq.error;
      if (pq.error) throw pq.error;

      // 같은 사람이 같은 태그를 두 번 셀 일은 없지만, 사람 단위로 센다
      const byTag = new Map<string, Set<string>>();
      const foodVeto = new Set<string>();
      for (const r of (rq.data ?? []) as { member_id: string; tag: string | null; food_id: string | null }[]) {
        if (r.tag) {
          if (!byTag.has(r.tag)) byTag.set(r.tag, new Set());
          byTag.get(r.tag)!.add(r.member_id);
        } else if (r.food_id) {
          foodVeto.add(r.member_id);
        }
      }

      const lean = Object.fromEntries(AXES.map((a) => [a, { pos: 0, neg: 0 }])) as GroupProfile['lean'];
      let quizzed = 0;
      for (const p of (pq.data ?? []) as { axes: Partial<Axes> | null }[]) {
        if (!hasTakenQuiz(p.axes)) continue;
        quizzed++;
        for (const a of AXES) {
          const v = p.axes![a]!;
          if (v > 0) lean[a].pos++;
          else if (v < 0) lean[a].neg++;
        }
      }

      return {
        restrictions: [...byTag.entries()].map(([tag, s]) => ({ tag, count: s.size })).sort((x, y) => y.count - x.count),
        foodVetoPeople: foodVeto.size,
        lean,
        quizzed,
        claimed: userIds.length,
      };
    },
  });
}
