// 내 못 먹는 것 — 모임이 아니라 사람에 붙는다 (0007). 모든 모임에 같은 값이 적용된다.
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { RestrictionKind } from '../types/db';

export interface MyRestrictions {
  tags: string[];
  food_ids: string[];
  kind: RestrictionKind;
}

export function useMyRestrictions() {
  return useQuery({
    queryKey: ['restrictions', 'me'],
    queryFn: async (): Promise<MyRestrictions> => {
      const { data, error } = await supabase.rpc('get_my_restrictions');
      if (error) throw error;
      const d = (data ?? {}) as Partial<MyRestrictions>;
      return { tags: d.tags ?? [], food_ids: d.food_ids ?? [], kind: d.kind ?? 'dislike' };
    },
  });
}
