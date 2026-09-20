/** 내 밥비티아이 — 전부 meals 파생 (views + member_recent_foods). */
import { useQuery } from '@tanstack/react-query';

import { bapType, explorationRatio, topFood } from '../lib/bapbti';
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
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      const { data: mine, error: e0 } = await supabase.from('members').select('*').eq('user_id', uid ?? '');
      if (e0) throw e0;
      const memberIds = ((mine ?? []) as MemberRow[]).map((m) => m.id);
      const empty: MeStats = { memberIds, total: 0, distinct: 0, catalogSize: 0, top: null, eatenFoods: [], people: [], ratio: null, type: 'unknown' };
      if (memberIds.length === 0) return empty;

      const [{ data: stats }, { data: foodCounts }, { data: pairs }, { data: catalog }] = await Promise.all([
        supabase.from('member_meal_stats').select('*').in('member_id', memberIds),
        supabase.from('member_food_counts').select('*').in('member_id', memberIds),
        supabase.from('pair_meal_counts').select('*').or(memberIds.map((id) => `member_a.eq.${id},member_b.eq.${id}`).join(',')),
        supabase.from('foods').select('*').is('group_id', null),
      ]);

      // 여러 모임의 멤버 id를 한 사람으로 합산
      const total = (stats ?? []).reduce((a, s) => a + (s.total as number), 0);
      const byFood: Record<string, number> = {};
      for (const fc of foodCounts ?? []) byFood[fc.food_id as string] = (byFood[fc.food_id as string] ?? 0) + (fc.n as number);
      const foodIds = Object.keys(byFood);
      const { data: foods } = foodIds.length ? await supabase.from('foods').select('*').in('id', foodIds) : { data: [] as FoodRow[] };
      const foodMap = new Map((foods ?? []).map((f) => [f.id as string, f as FoodRow]));
      const topC = topFood(foodIds.map((food_id) => ({ food_id, n: byFood[food_id] })));

      const byPerson: Record<string, number> = {};
      for (const p of pairs ?? []) {
        const other = memberIds.includes(p.member_a as string) ? (p.member_b as string) : (p.member_a as string);
        byPerson[other] = (byPerson[other] ?? 0) + (p.n as number);
      }
      const otherIds = Object.keys(byPerson);
      const { data: others } = otherIds.length ? await supabase.from('members').select('*').in('id', otherIds) : { data: [] as MemberRow[] };
      const people = ((others ?? []) as MemberRow[]).map((member) => ({ member, n: byPerson[member.id] })).sort((a, b) => b.n - a.n).slice(0, 5);

      // 축 1: 최근 10끼 (모임 여러 개면 합쳐서 최신순 — v1은 첫 멤버 기준으로 근사)
      const recent: string[] = [];
      for (const mid of memberIds) {
        const { data } = await supabase.rpc('member_recent_foods', { p_member_id: mid, p_n: 10 });
        recent.push(...((data ?? []) as string[]));
      }
      const ratio = explorationRatio(recent);

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
