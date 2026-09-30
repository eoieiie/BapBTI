// 내 프로필 — 사람 단위(0009). 이름·네 글자 코드의 출처.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Answers, Axes } from '../lib/quiz';
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
