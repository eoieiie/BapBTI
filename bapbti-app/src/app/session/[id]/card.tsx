// 4 결과 카드 화면 — meals 에서 파생한 n번째들. 공유는 v1 텍스트(Share API). 이미지 저장은 카드 디자인 확정 후.
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Platform, Share } from 'react-native';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';

import { ResultCard, type CardData } from '../../../components/ResultCard';
import { Bottom, Button, ErrorBox, Header, Hint, Loading, Screen } from '../../../components/ui';
import { currentUserId } from '../../../lib/currentUser';
import { foodName, humanError, t } from '../../../lib/i18n';
import { supabase } from '../../../lib/supabase';
import type { FoodRow, MealRow, MemberRow } from '../../../types/db';

export default function Card() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shot = useRef<ViewShotRef>(null);
  const [sharing, setSharing] = useState(false);

  // 네이티브: 카드를 PNG 로 찍어서 공유 시트. 웹: 텍스트.
  const share = async (text: string) => {
    if (Platform.OS === 'web' || !shot.current) {
      await Share.share({ message: text });
      return;
    }
    setSharing(true);
    try {
      const uri = await shot.current.capture();
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '밥비티아이' });
      else await Share.share({ message: text });
    } finally {
      setSharing(false);
    }
  };

  const q = useQuery({
    queryKey: ['card', id],
    enabled: !!id,
    queryFn: async (): Promise<CardData & { shareText: string }> => {
      const { data: meal, error: e0 } = await supabase.from('meals').select('*, foods(*), meal_participants(member_id)').eq('session_id', id!).single();
      if (e0) throw e0;
      const ml = meal as MealRow & { foods: FoodRow; meal_participants: { member_id: string }[] };
      const [{ data: group }, { data: members }] = await Promise.all([
        supabase.from('groups').select('name').eq('id', ml.group_id).single(),
        supabase.from('members').select('*').eq('group_id', ml.group_id),
      ]);
      const ms = (members ?? []) as MemberRow[];
      const uid = currentUserId();
      const me = ms.find((m) => m.user_id === uid) ?? null;
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
        foodKo: ml.foods.name,
        foodEn: ml.foods.name_en,
        others: others.map((o) => o.display_name),
        pairLines,
        groupNth: (gcount as { n: number } | null)?.n ?? 1,
        myNth: (mcount as { n: number } | null)?.n ?? 1,
      };
      const fname = foodName(ml.foods);
      const shareText = [
        `${d.groupName} · ${fname}`,
        ...pairLines.slice(0, 2).map((p) => t('card.pairNth', { name: p.name, n: p.n })),
        t('card.groupNth', { food: fname, n: d.groupNth }),
        '— 밥비티아이',
      ].join('\n');
      return { ...d, shareText };
    },
  });

  if (q.isError) return <Screen><ErrorBox message={humanError(q.error.message)} onRetry={() => q.refetch()} /></Screen>;
  if (!q.data) return <Screen><Loading /></Screen>;

  return (
    <Screen>
      <Header title={t('card.title')} back />
      <ViewShot ref={shot} options={{ format: 'png', quality: 1 }} style={{ backgroundColor: '#F2F4F6', padding: 12, margin: -12 }}>
        <ResultCard d={q.data} />
      </ViewShot>
      <Hint className="mt-3 text-center">{t('card.saved')}</Hint>
      <Bottom>
        <Button label={t('card.share')} primary loading={sharing} onPress={() => share(q.data.shareText)} />
      </Bottom>
    </Screen>
  );
}
