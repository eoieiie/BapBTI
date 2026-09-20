/**
 * useLiveSession — 세션 한 판의 상태 + Realtime 구독.
 * 변경이 오면 통째로 다시 읽는다 (6명 규모에서 부분 갱신은 과설계).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '../lib/supabase';
import type { CandidateRow, FoodRow, MemberRow, ParticipantRow, RestrictionRow, SessionRow, VoteRow } from '../types/db';
import { groupKeys } from './useGroups';

export const sessionKey = (id: string) => ['session', id] as const;

export interface LiveSession {
  session: SessionRow;
  members: MemberRow[];
  me: MemberRow | null;
  participants: ParticipantRow[];
  candidates: (CandidateRow & { foods: FoodRow })[];
  votes: VoteRow[];
  restrictions: RestrictionRow[];
  isHost: boolean;
}

export function useLiveSession(id: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: sessionKey(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<LiveSession> => {
      const { data: session, error: e0 } = await supabase.from('sessions').select('*').eq('id', id!).single();
      if (e0) throw e0;
      const s = session as SessionRow;
      const [{ data: members, error: e1 }, { data: participants, error: e2 }, { data: candidates, error: e3 }, { data: votes, error: e4 }, { data: auth }] =
        await Promise.all([
          supabase.from('members').select('*').eq('group_id', s.group_id).order('created_at'),
          supabase.from('session_participants').select('*').eq('session_id', s.id).order('joined_at'),
          supabase.from('candidates').select('*, foods(*)').eq('session_id', s.id).order('created_at'),
          supabase.from('votes').select('*').eq('session_id', s.id),
          supabase.auth.getUser(),
        ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;
      if (e4) throw e4;
      const ms = (members ?? []) as MemberRow[];
      const memberIds = ms.map((m) => m.id);
      const { data: restrictions, error: e5 } = await supabase.from('restrictions').select('*').in('member_id', memberIds);
      if (e5) throw e5;
      const me = ms.find((m) => m.user_id === auth.user?.id) ?? null;
      return {
        session: s,
        members: ms,
        me,
        participants: (participants ?? []) as ParticipantRow[],
        candidates: (candidates ?? []) as LiveSession['candidates'],
        votes: (votes ?? []) as VoteRow[],
        restrictions: (restrictions ?? []) as RestrictionRow[],
        isHost: !!me && me.id === s.started_by,
      };
    },
  });

  // Realtime: 이 세션에 관한 4개 테이블 변화 → 재조회
  useEffect(() => {
    if (!id) return;
    const invalidate = () => qc.invalidateQueries({ queryKey: sessionKey(id) });
    const ch = supabase
      .channel(`session:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${id}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_participants', filter: `session_id=eq.${id}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates', filter: `session_id=eq.${id}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `session_id=eq.${id}` }, invalidate)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, qc]);

  return query;
}

function useSessionRpc<TArgs>(fn: (args: TArgs) => Promise<unknown>, sessionId: string | undefined, groupId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => {
      if (sessionId) qc.invalidateQueries({ queryKey: sessionKey(sessionId) });
      if (groupId) qc.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

export function useJoinSession(sessionId: string | undefined) {
  return useSessionRpc(async (_: void) => {
    const { error } = await supabase.rpc('join_session', { p_session_id: sessionId });
    if (error) throw error;
  }, sessionId);
}
export function useAddCandidate(sessionId: string | undefined) {
  return useSessionRpc(async (v: { foodId: string; pitch?: string }) => {
    const { error } = await supabase.rpc('add_candidate', { p_session_id: sessionId, p_food_id: v.foodId, p_pitch: v.pitch ?? null });
    if (error) throw error;
  }, sessionId);
}
export function useRemoveCandidate(sessionId: string | undefined) {
  return useSessionRpc(async (foodId: string) => {
    const { error } = await supabase.rpc('remove_candidate', { p_session_id: sessionId, p_food_id: foodId });
    if (error) throw error;
  }, sessionId);
}
export function useSetPitch(sessionId: string | undefined) {
  return useSessionRpc(async (v: { foodId: string; pitch: string }) => {
    const { error } = await supabase.rpc('set_pitch', { p_session_id: sessionId, p_food_id: v.foodId, p_pitch: v.pitch });
    if (error) throw error;
  }, sessionId);
}
export function useOpenVoting(sessionId: string | undefined) {
  return useSessionRpc(async (_: void) => {
    const { error } = await supabase.rpc('open_voting', { p_session_id: sessionId });
    if (error) throw error;
  }, sessionId);
}
export function useCastVote(sessionId: string | undefined) {
  return useSessionRpc(async (foodId: string) => {
    const { error } = await supabase.rpc('cast_vote', { p_session_id: sessionId, p_food_id: foodId });
    if (error) throw error;
  }, sessionId);
}
export function useSpin(sessionId: string | undefined, groupId?: string) {
  return useSessionRpc(async (_: void) => {
    const { data, error } = await supabase.rpc('spin_roulette', { p_session_id: sessionId });
    if (error) throw error;
    return data as string;
  }, sessionId, groupId);
}
