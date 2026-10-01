// 내 프로필 — 사람 단위(0009). 이름·네 글자 코드의 출처.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Answers, Axes } from '../lib/quiz';
import { currentUserId } from '../lib/currentUser';
import { supabase } from '../lib/supabase';

export interface MyProfile {
  handle: string | null;
  display_name: string | null;
  axes: Partial<Axes> | null;
  quiz_answers: Answers | null;
}

export const profileKey = ['profile', 'me'] as const;

export function useProfile() {
  return useQuery({
    queryKey: profileKey,
    queryFn: async (): Promise<MyProfile | null> => {
      const { data, error } = await supabase.rpc('get_my_profile');
      if (error) throw error;
      return (data as MyProfile | null) ?? null;
    },
  });
}

/** 핸들이 비어 있는지 확인. profiles 는 로그인한 사람이면 읽을 수 있어서(0009) 바로 조회한다. */
export async function isHandleTaken(handle: string): Promise<boolean> {
  const { data, error } = await supabase.from('profiles').select('user_id').eq('handle', handle).maybeSingle();
  if (error) throw error;
  const { data: auth } = await supabase.auth.getUser();
  return !!data && data.user_id !== auth.user?.id; // 내 핸들이면 '사용 중'이 아니다
}

export function useSetHandle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (handle: string) => {
      const { error } = await supabase.from('profiles').update({ handle }).eq('user_id', currentUserId() ?? '');
      if (error) throw error;
    },
    onSuccess: (_d, handle) => {
      qc.setQueryData<MyProfile | null>(profileKey, (old) => (old ? { ...old, handle } : old));
    },
  });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { displayName: string; quiz: Answers | null; axes: Axes | null }) => {
      const { error } = await supabase.rpc('save_my_profile', {
        p_display_name: v.displayName,
        p_quiz: v.quiz,
        p_axes: v.axes,
      });
      if (error) throw error;
    },
    // 저장한 값을 캐시에 바로 넣는다. 재조회를 기다리면 그 사이 온보딩 게이트가
    // "프로필 없음"으로 보고 온보딩으로 되돌려 보낸다.
    onSuccess: (_d, v) => {
      qc.setQueryData<MyProfile | null>(profileKey, (old) => ({
        handle: old?.handle ?? null,
        display_name: v.displayName,
        axes: v.axes ?? old?.axes ?? null,
        quiz_answers: v.quiz ?? old?.quiz_answers ?? null,
      }));
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
