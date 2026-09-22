/** 내 밥비티아이 — 전부 meals 파생 (views + member_recent_foods). */
import { useQuery } from '@tanstack/react-query';

import { bapType, explorationRatio, RECENT_WINDOW, topFood } from '../lib/bapbti';
import { currentUserId } from '../lib/currentUser';
import { supabase } from '../lib/supabase';
import type { FoodRow, MemberRow } from '../types/db';

export interface MeStats {
  memberIds: string[];
  total: number;
  distinct: number;
  catalogSize: number;
  top: { food: FoodRow; n: number } | null;
  eatenFoods: FoodRow[];
  people: { member: MemberRow; n: number }[];
  ratio: number | null;
  type: ReturnType<typeof bapType>;
}

export function useMe() {
  return useQuery({
    queryKey: ['me', 'stats'],
    queryFn: async (): Promise<MeStats> => {
      const uid = currentUserId();
      const { data: mine, error: e0 } = uid
        ? await supabase.from('members').select('*').eq('user_id', uid)
        : { data: [] as MemberRow[], error: null };
      if (e0) throw e0;
      const memberIds = ((mine ?? []) as MemberRow[]).map((m) => m.id);
      const empty: MeStats = { memberIds, total: 0, distinct: 0, catalogSize: 0, top: null, eatenFoods: [], people: [], ratio: null, type: 'unknown' };
      if (memberIds.length === 0) return empty;

      const [statsQ, foodCountsQ, pairsQ, catalogQ, recentQ] = await Promise.all([
        supabase.from('member_meal_stats').select('*').in('member_id', memberIds),
        supabase.from('member_food_counts').select('*').in('member_id', memberIds),
        supabase.from('pair_meal_counts').select('*').or(memberIds.map((id) => `member_a.eq.${id},member_b.eq.${id}`).join(',')),
        supabase.from('foods').select('*').is('group_id', null),
        // 최근 n끼 — 모임이 여러 개여도 시간순으로 섞어서 한 번에 (예전엔 멤버별로 따로 불러 순서가 틀렸다)
        supabase
          .from('meals')
          .select('food_id, eaten_at, meal_participants!inner(member_id)')
          .in('meal_participants.member_id', memberIds)
          .order('eaten_at', { ascending: false })
          .limit(RECENT_WINDOW),
      ]);
      for (const q of [statsQ, foodCountsQ, pairsQ, catalogQ, recentQ]) if (q.error) throw q.error;
      const { data: stats } = statsQ;
      const { data: foodCounts } = foodCountsQ;
      const { data: pairs } = pairsQ;
      const { data: catalog } = catalogQ;

      // 여러 모임의 멤버 id를 한 사람으로 합산
      const total = (stats ?? []).reduce((a, s) => a + (s.total as number), 0);
      const byFood: Record<string, number> = {};
      for (const fc of foodCounts ?? []) byFood[fc.food_id as string] = (byFood[fc.food_id as string] ?? 0) + (fc.n as number);
      const foodIds = Object.keys(byFood);
      const { data: foods, error: eFoods } = foodIds.length ? await supabase.from('foods').select('*').in('id', foodIds) : { data: [] as FoodRow[], error: null };
      if (eFoods) throw eFoods;
      const foodMap = new Map((foods ?? []).map((f) => [f.id as string, f as FoodRow]));
      const topC = topFood(foodIds.map((food_id) => ({ food_id, n: byFood[food_id] })));

      const byPerson: Record<string, number> = {};
      for (const p of pairs ?? []) {
        const other = memberIds.includes(p.member_a as string) ? (p.member_b as string) : (p.member_a as string);
        byPerson[other] = (byPerson[other] ?? 0) + (p.n as number);
      }
      const otherIds = Object.keys(byPerson);
      const { data: others, error: eOthers } = otherIds.length ? await supabase.from('members').select('*').in('id', otherIds) : { data: [] as MemberRow[], error: null };
      if (eOthers) throw eOthers;
      const people = ((others ?? []) as MemberRow[]).map((member) => ({ member, n: byPerson[member.id] })).sort((a, b) => b.n - a.n).slice(0, 5);

      const ratio = explorationRatio(((recentQ.data ?? []) as { food_id: string }[]).map((m) => m.food_id));

      return {
        memberIds,
        total,
        distinct: foodIds.length,
        catalogSize: (catalog ?? []).length,
        top: topC && foodMap.get(topC.food_id) ? { food: foodMap.get(topC.food_id)!, n: topC.n } : null,
        eatenFoods: foodIds.map((id) => foodMap.get(id)).filter((f): f is FoodRow => !!f),
        people,
        ratio,
        type: bapType(ratio),
      };
    },
  });
}
