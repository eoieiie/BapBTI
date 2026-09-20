import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { FoodRow, GroupByCode, GroupRow, MealRow, MemberRow } from '../types/db';

export const groupKeys = {
  mine: ['groups', 'mine'] as const,
  detail: (id: string) => ['groups', id] as const,
  byCode: (code: string) => ['groups', 'code', code] as const,
};

/** 내가 멤버인 모임 목록 (+ 마지막 끼니) */
export function useMyGroups() {
  return useQuery({
    queryKey: groupKeys.mine,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('members')
        .select('id, group_id, groups!members_group_id_fkey(*)') // members↔groups FK 가 둘(group_id / created_by)이라 명시 안 하면 PostgREST 300
        .eq('user_id', auth.user?.id ?? '') // RLS 는 "내 모임의 모든 멤버"를 주므로 내 것만 걸러야 한다
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((m) => ({ member_id: m.id as string, group: m.groups as unknown as GroupRow }));
    },
  });
}

export interface GroupDetail {
  group: GroupRow;
  members: MemberRow[];
  me: MemberRow | null;
  recent: (MealRow & { foods: FoodRow; meal_participants: { member_id: string }[] })[];
  activeSessionId: string | null;
}

export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: groupKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<GroupDetail> => {
      const [{ data: group, error: e1 }, { data: members, error: e2 }, { data: recent, error: e3 }, { data: active, error: e4 }, { data: auth }] =
        await Promise.all([
          supabase.from('groups').select('*').eq('id', id!).single(),
          supabase.from('members').select('*').eq('group_id', id!).order('created_at'),
          supabase.from('meals').select('*, foods(*), meal_participants(member_id)').eq('group_id', id!).order('eaten_at', { ascending: false }).limit(5),
          supabase.from('sessions').select('id').eq('group_id', id!).neq('status', 'done').order('created_at', { ascending: false }).limit(1),
          supabase.auth.getUser(),
        ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;
      if (e4) throw e4;
      const uid = auth.user?.id;
      return {
        group: group as GroupRow,
        members: (members ?? []) as MemberRow[],
        me: ((members ?? []) as MemberRow[]).find((m) => m.user_id === uid) ?? null,
        recent: (recent ?? []) as GroupDetail['recent'],
        activeSessionId: active?.[0]?.id ?? null,
      };
    },
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { name: string; displayName: string }) => {
      const { data, error } = await supabase.rpc('create_group', { p_name: v.name, p_display_name: v.displayName });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.mine }),
  });
}

export function useGroupByCode(code: string | undefined) {
  return useQuery({
    queryKey: groupKeys.byCode(code ?? ''),
    enabled: !!code,
    queryFn: async (): Promise<GroupByCode | null> => {
      const { data, error } = await supabase.rpc('get_group_by_code', { p_code: code! });
      if (error) throw error;
      return (data as GroupByCode | null) ?? null;
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { code: string; memberId?: string; displayName?: string }) => {
      const { data, error } = await supabase.rpc('join_group', {
        p_code: v.code,
        p_member_id: v.memberId ?? null,
        p_display_name: v.displayName ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useRenameGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; name: string }) => {
      const { error } = await supabase.from('groups').update({ name: v.name }).eq('id', v.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: groupKeys.detail(v.id) });
      qc.invalidateQueries({ queryKey: groupKeys.mine });
    },
  });
}

export function useRenameMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { memberId: string; groupId: string; name: string }) => {
      const { error } = await supabase.from('members').update({ display_name: v.name }).eq('id', v.memberId);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: groupKeys.detail(v.groupId) }),
  });
}

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data, error } = await supabase.rpc('start_session', { p_group_id: groupId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_d, groupId) => qc.invalidateQueries({ queryKey: groupKeys.detail(groupId) }),
  });
}

/** 카탈로그: 전역 시드 + 이 모임 커스텀. 자주 안 바뀜. */
export function useFoods(groupId: string | undefined) {
  return useQuery({
    queryKey: ['foods', groupId ?? 'global'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<FoodRow[]> => {
      let q = supabase.from('foods').select('*').order('name');
      q = groupId ? q.or(`group_id.is.null,group_id.eq.${groupId}`) : q.is('group_id', null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as FoodRow[];
    },
  });
}
