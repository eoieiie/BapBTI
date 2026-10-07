/**
 * useLiveSession — 세션 한 판의 상태 + Realtime 구독.
 * 변경이 오면 통째로 다시 읽는다 (6명 규모에서 부분 갱신은 과설계).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '../lib/supabase';
import { currentUserId } from '../lib/currentUser';
import { roulettePool } from '../lib/decision';
import type { CandidateRow, FoodRow, MemberRow, ParticipantRow, SessionRow, VoteRow } from '../types/db';
import { groupKeys } from './useGroups';

export const sessionKey = (id: string) => ['session', id] as const;

/** Realtime 으로 지켜보는 테이블과, 그 테이블에서 세션을 가리키는 컬럼 */
const WATCHED: readonly [string, string][] = [
  ['sessions', 'id'],
  ['session_participants', 'session_id'],
  ['candidates', 'session_id'],
  ['votes', 'session_id'],
];

export type SessionCandidate = CandidateRow & { foods: FoodRow };

export interface LiveSession {
  session: SessionRow;
  members: MemberRow[];
  me: MemberRow | null;
  participants: ParticipantRow[];
  candidates: SessionCandidate[];
  votes: VoteRow[];
  isHost: boolean;
  /** 화면이 쓰는 파생값 — 여기서 한 번만 계산해서 각 단계 컴포넌트는 그대로 쓴다.
   *  votes 는 RLS 로 **내 표만** 온다(0010). 남이 무엇을 찍었는지는 클라이언트가 알 수 없다. */
  nameOf: (memberId: string) => string;
  myVotes: string[];
  votedMembers: number;
  wheel: { wheelFoods: FoodRow[]; winnerIndex: number | null; decidedFood: FoodRow | null };
}

/** 룰렛에 그릴 조각들. 서버가 고른 당첨 후보가 빠져 있으면 끼워 넣는다 — 규칙이 어긋나도 화면은 안 깨지게. */
function buildWheel(candidates: SessionCandidate[], votes: { food_id: string }[], decidedFoodId: string | null): LiveSession['wheel'] {
  const pool = roulettePool(candidates, votes);
  if (decidedFoodId && !pool.includes(decidedFoodId)) pool.push(decidedFoodId);
  const byId = new Map(candidates.map((c) => [c.food_id, c.foods]));
  const wheelFoods = pool.map((fid) => byId.get(fid)).filter((f): f is FoodRow => !!f);
  return {
    wheelFoods,
    winnerIndex: decidedFoodId ? wheelFoods.findIndex((f) => f.id === decidedFoodId) : null,
    decidedFood: decidedFoodId ? (byId.get(decidedFoodId) ?? null) : null,
  };
}

export function useLiveSession(id: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: sessionKey(id ?? ''),
    enabled: !!id,
    // 남의 모임 세션 링크를 열면 RLS 가 0행을 주고 .single() 이 실패한다. 다시 시도해도 결과가 같다.
    retry: false,
    queryFn: async (): Promise<LiveSession> => {
      const { data: session, error: e0 } = await supabase.from('sessions').select('*').eq('id', id!).single();
      if (e0) throw e0;
      const s = session as SessionRow;
      const [{ data: members, error: e1 }, { data: participants, error: e2 }, { data: candidates, error: e3 }, { data: votes, error: e4 }] =
        await Promise.all([
          supabase.from('members').select('*').eq('group_id', s.group_id).order('created_at'),
          supabase.from('session_participants').select('*').eq('session_id', s.id).order('joined_at'),
          supabase.from('candidates').select('*, foods(*)').eq('session_id', s.id).order('created_at'),
          supabase.from('votes').select('*').eq('session_id', s.id),
        ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;
      if (e4) throw e4;
      // 룰렛 조각: 결과가 나온 판에서만 서버가 "1표 이상 받은 음식"을 준다 (누가 찍었는지는 안 준다)
      let votedFoods: string[] = [];
      if (s.status === 'done') {
        const { data: vf, error: e5 } = await supabase.rpc('session_voted_foods', { p_session_id: s.id });
        if (e5) throw e5;
        votedFoods = ((vf ?? []) as string[]).map(String);
      }
      const ms = (members ?? []) as MemberRow[];
      const uid = currentUserId();
      const me = ms.find((m) => m.user_id === uid) ?? null;
      const cs = (candidates ?? []) as SessionCandidate[];
      const vs = (votes ?? []) as VoteRow[];
      const nameById = new Map(ms.map((m) => [m.id, m.display_name]));
      return {
        session: s,
        members: ms,
        me,
        participants: (participants ?? []) as ParticipantRow[],
        candidates: cs,
        votes: vs,
        isHost: !!me && me.id === s.started_by,
        nameOf: (memberId: string) => nameById.get(memberId) ?? '?',
        myVotes: me ? vs.filter((v) => v.member_id === me.id).map((v) => v.food_id) : [],
        votedMembers: ((participants ?? []) as ParticipantRow[]).filter((p) => p.voted).length,
        wheel: buildWheel(cs, votedFoods.map((food_id) => ({ food_id })), s.decided_food_id),
      };
    },
  });

  // Realtime: 이 세션에 관한 4개 테이블 변화 → 재조회.
  useEffect(() => {
    if (!id) return;
    // 구독마다 새 이름을 쓴다. removeChannel 은 비동기라 같은 이름을 재사용하면 정리 전에 새 구독이 붙어서
    // 이미 subscribe() 된 채널에 on() 을 거는 꼴이 되고, 화면이 죽는다. postgres_changes 는 필터가 on() 에 있어서
    // 채널 이름은 무엇이든 상관없다.
    const topic = `session:${id}:${Math.random().toString(36).slice(2)}`;

    const invalidate = () => qc.invalidateQueries({ queryKey: sessionKey(id) });
    const channel = supabase.channel(topic);
    for (const [table, filter] of WATCHED) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `${filter}=eq.${id}` }, invalidate);
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('spin_roulette', { p_session_id: sessionId });
      if (error) throw error;
      return data as string;
    },
    // 룰렛이 돌면 meals 가 생긴다 → 세션·모임·프로필이 전부 바뀐다
    onSettled: () => {
      if (sessionId) qc.invalidateQueries({ queryKey: sessionKey(sessionId) });
      if (groupId) qc.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
