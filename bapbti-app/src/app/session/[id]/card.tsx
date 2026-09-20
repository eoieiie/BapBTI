// 4 결과 카드 화면 — meals 에서 파생한 n번째들. 공유는 v1 텍스트(Share API). 이미지 저장은 카드 디자인 확정 후.
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';

import { ResultCard, type CardData } from '../../../components/ResultCard';
import { Bottom, Button, ErrorBox, Header, Hint, Loading, Screen } from '../../../components/ui';
import { foodName, t } from '../../../lib/i18n';
import { supabase } from '../../../lib/supabase';
import type { FoodRow, MealRow, MemberRow } from '../../../types/db';

export default function Card() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const q = useQuery({
    queryKey: ['card', id],
    enabled: !!id,
    queryFn: async (): Promise<CardData & { shareText: string }> => {
      const { data: meal, error: e0 } = await supabase.from('meals').select('*, foods(*), meal_participants(member_id)').eq('session_id', id!).single();
      if (e0) throw e0;
      const ml = meal as MealRow & { foods: FoodRow; meal_participants: { member_id: string }[] };
      const [{ data: group }, { data: members }, { data: auth }] = await Promise.all([
        supabase.from('groups').select('name').eq('id', ml.group_id).single(),
        supabase.from('members').select('*').eq('group_id', ml.group_id),
        supabase.auth.getUser(),
      ]);
      const ms = (members ?? []) as MemberRow[];
      const me = ms.find((m) => m.user_id === auth.user?.id) ?? null;
      const pids = ml.meal_participants.map((p) => p.member_id);
      const others = ms.filter((m) => pids.includes(m.id) && m.id !== me?.id);

      const [{ data: pairs }, { data: gcount }, { data: mcount }] = await Promise.all([
        me ? supabase.from('pair_meal_counts').select('*').or(`member_a.eq.${me.id},member_b.eq.${me.id}`) : { data: [] },
        supabase.from('group_food_counts').select('n').eq('group_id', ml.group_id).eq('food_id', ml.food_id).maybeSingle(),
        me ? supabase.from('member_food_counts').select('n').eq('member_id', me.id).eq('food_id', ml.food_id).maybeSingle() : { data: null },
      ]);
      const pairN = new Map<string, number>();
      for (const p of pairs ?? []) pairN.set(p.member_a === me?.id ? (p.member_b as string) : (p.member_a as string), p.n as number);
      const pairLines = others.map((o) => ({ name: o.display_name, n: pairN.get(o.id) ?? 1 })).sort((a, b) => b.n - a.n);

      const d: CardData = {
        foodId: ml.food_id,
        groupName: (group as { name: string } | null)?.name ?? '',
        date: new Date(ml.eaten_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
        foodEmoji: ml.foods.emoji,
        foodKo: ml.foods.name,
        foodEn: ml.foods.name_en,
        others: others.map((o) => o.display_name),
        pairLines,
        groupNth: (gcount as { n: number } | null)?.n ?? 1,
        myNth: (mcount as { n: number } | null)?.n ?? 1,
      };
      const fname = foodName(ml.foods);
      const shareText = [
        `${d.groupName} · ${d.foodEmoji} ${fname}`,
        ...pairLines.slice(0, 2).map((p) => t('card.pairNth', { name: p.name, n: p.n })),
        t('card.groupNth', { food: fname, n: d.groupNth }),
        '— 밥비티아이',
      ].join('\n');
      return { ...d, shareText };
    },
  });

  if (q.isPending) return <Screen><Loading /></Screen>;
  if (q.isError) return <Screen><ErrorBox message={q.error.message} onRetry={() => q.refetch()} /></Screen>;

  return (
    <Screen>
      <Header title={t('card.title')} back />
      <ResultCard d={q.data} />
      <Hint className="mt-3 text-center">{t('card.saved')}</Hint>
      <Bottom>
        <Button label={t('card.share')} primary onPress={() => Share.share({ message: q.data.shareText })} />
      </Bottom>
    </Screen>
  );
}
