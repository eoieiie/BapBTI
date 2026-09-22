// 못 먹는 거 — 사람에 붙는다. 여기서 한 번 적으면 내 모든 모임에 적용된다 (0007).
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Bottom, Button, Card, Chip, ErrorBox, FoodDisc, Header, Hint, Input, Loading, Row, Screen, Section } from '../components/ui';
import { useFoods } from '../hooks/useGroups';
import { useMyRestrictions, type MyRestrictions } from '../hooks/useMyRestrictions';
import { foodName, humanError, t } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { INGREDIENT_TAGS, REQUIREMENT_TAGS } from '../lib/tags';
import type { RestrictionKind } from '../types/db';

const KINDS: RestrictionKind[] = ['allergy', 'dislike', 'belief'];

export default function Restrictions() {
  const q = useMyRestrictions();
  if (q.isError) return <Screen><ErrorBox message={humanError(q.error.message)} onRetry={() => q.refetch()} /></Screen>;
  if (!q.data) return <Screen><Loading /></Screen>;
  return <Editor key={q.dataUpdatedAt} initial={q.data} />;
}

function Editor({ initial }: { initial: MyRestrictions }) {
  const router = useRouter();
  const qc = useQueryClient();
  const foods = useFoods(undefined);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [foodIds, setFoodIds] = useState<string[]>(initial.food_ids);
  const [kind, setKind] = useState<RestrictionKind>(initial.kind);
  const [search, setSearch] = useState('');

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('set_my_restrictions', { p_tags: tags, p_food_ids: foodIds, p_kind: kind });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restrictions'] });
      qc.invalidateQueries({ queryKey: ['session'] });
      if (router.canGoBack()) router.back();
      else router.replace({ pathname: '/me' });
    },
  });

  const hits = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s || !foods.data) return [];
    return foods.data.filter((f) => !foodIds.includes(f.id) && (f.name.includes(s) || f.name_en.toLowerCase().includes(s))).slice(0, 6);
  }, [search, foods.data, foodIds]);

  const toggle = (v: string) => setTags(tags.includes(v) ? tags.filter((x) => x !== v) : [...tags, v]);
  const chosen = foodIds.map((fid) => foods.data?.find((x) => x.id === fid)).filter((f): f is NonNullable<typeof f> => !!f);

  return (
    <Screen>
      <Header title={t('restrictions.title')} back />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Hint>{t('restrictions.hint')}</Hint>

        <Section>{t('restrictions.tags')}</Section>
        <View className="flex-row flex-wrap gap-2">
          {[...INGREDIENT_TAGS, ...REQUIREMENT_TAGS].map((tag) => (
            <Chip key={tag} label={t(`restrictions.tag.${tag}`)} on={tags.includes(tag)} onPress={() => toggle(tag)} />
          ))}
        </View>

        <Section>{t('restrictions.foods')}</Section>
        <Input value={search} onChangeText={setSearch} placeholder={t('session.search')} />
        {(hits.length > 0 || chosen.length > 0) && (
          <Card className="mt-2 py-1">
            {hits.map((f, i) => (
              <Row key={f.id} onPress={() => { setFoodIds([...foodIds, f.id]); setSearch(''); }} last={i === hits.length - 1 && chosen.length === 0}>
                <FoodDisc foodId={f.id} size={36} />
                <Text className="flex-1 text-[16px] text-ink">{foodName(f)}</Text>
                <Ionicons name="add" size={20} color="#8E8E93" />
              </Row>
            ))}
            {chosen.map((f, i) => (
              <Row key={f.id} last={i === chosen.length - 1}>
                <FoodDisc foodId={f.id} size={36} />
                <Text className="flex-1 text-[16px] font-bold text-ink">{foodName(f)}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={t('common.cancel')} onPress={() => setFoodIds(foodIds.filter((x) => x !== f.id))} className="h-10 w-10 items-center justify-center">
                  <Ionicons name="close" size={20} color="#8E8E93" />
                </Pressable>
              </Row>
            ))}
          </Card>
        )}

        <Section>{t('restrictions.kind')}</Section>
        <View className="flex-row gap-2">
          {KINDS.map((k) => <Chip key={k} label={t(`restrictions.kinds.${k}`)} on={kind === k} onPress={() => setKind(k)} />)}
        </View>
        <View className="h-4" />
      </ScrollView>
      <Bottom>
        {save.isError && <Hint className="mb-2 text-center">{save.error.message}</Hint>}
        <Button label={t('common.save')} primary loading={save.isPending} onPress={() => save.mutate()} />
      </Bottom>
    </Screen>
  );
}
