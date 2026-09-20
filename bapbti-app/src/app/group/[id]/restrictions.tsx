// 6 못 먹는 거 — 멤버당 1회. 태그 토글 + 음식 직접 추가 + 종류.
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Bottom, Button, Card, Chip, ErrorBox, FoodDisc, Header, Hint, Input, Loading, Row, Screen, Section } from '../../../components/ui';
import { useFoods, useGroup } from '../../../hooks/useGroups';
import { foodName, t } from '../../../lib/i18n';
import { supabase } from '../../../lib/supabase';
import { INGREDIENT_TAGS, REQUIREMENT_TAGS } from '../../../lib/tags';
import type { RestrictionKind, RestrictionRow } from '../../../types/db';

const KINDS: RestrictionKind[] = ['allergy', 'dislike', 'belief'];

export default function Restrictions() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const group = useGroup(id);
  const me = group.data?.me ?? null;

  const current = useQuery({
    queryKey: ['restrictions', me?.id ?? ''],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase.from('restrictions').select('*').eq('member_id', me!.id);
      if (error) throw error;
      return (data ?? []) as RestrictionRow[];
    },
  });

  if (group.isPending || (me && current.isPending)) return <Screen><Loading /></Screen>;
  if (group.isError) return <Screen><ErrorBox message={group.error.message} /></Screen>;
  if (!me) return <Screen><ErrorBox message="not a member" /></Screen>;
  return <Editor key={current.dataUpdatedAt} groupId={id!} initial={current.data ?? []} />;
}

function Editor({ groupId, initial }: { groupId: string; initial: RestrictionRow[] }) {
  const router = useRouter();
  const qc = useQueryClient();
  const foods = useFoods(groupId);
  const [tags, setTags] = useState<string[]>(() => initial.filter((r) => r.tag).map((r) => r.tag!));
  const [foodIds, setFoodIds] = useState<string[]>(() => initial.filter((r) => r.food_id).map((r) => r.food_id!));
  const [kind, setKind] = useState<RestrictionKind>(() => initial[0]?.kind ?? 'dislike');
  const [search, setSearch] = useState('');

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('set_restrictions', { p_group_id: groupId, p_tags: tags, p_food_ids: foodIds, p_kind: kind });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restrictions'] });
      router.back();
    },
  });

  const hits = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s || !foods.data) return [];
    return foods.data.filter((f) => !foodIds.includes(f.id) && (f.name.includes(s) || f.name_en.toLowerCase().includes(s))).slice(0, 6);
  }, [search, foods.data, foodIds]);

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const chosen = foodIds.map((fid) => foods.data?.find((x) => x.id === fid)).filter((f): f is NonNullable<typeof f> => !!f);

  return (
    <Screen>
      <Header title={t('restrictions.title')} back />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Hint>{t('restrictions.hint')}</Hint>

        <Section>{t('restrictions.tags')}</Section>
        <View className="flex-row flex-wrap gap-2">
          {[...INGREDIENT_TAGS, ...REQUIREMENT_TAGS].map((tag) => (
            <Chip key={tag} label={t(`restrictions.tag.${tag}`)} on={tags.includes(tag)} onPress={() => toggle(tags, tag, setTags)} />
          ))}
        </View>

        <Section>{t('restrictions.foods')}</Section>
        <Input value={search} onChangeText={setSearch} placeholder={t('session.search')} />
        {(hits.length > 0 || chosen.length > 0) && (
          <Card className="mt-2 py-1">
            {hits.map((f, i) => (
              <Row key={f.id} onPress={() => { setFoodIds([...foodIds, f.id]); setSearch(''); }} last={i === hits.length - 1 && chosen.length === 0}>
                <FoodDisc emoji={f.emoji} size={40} />
                <Text className="flex-1 text-[16px] text-ink">{foodName(f)}</Text>
                <Ionicons name="add" size={20} color="#8E8E93" />
              </Row>
            ))}
            {chosen.map((f, i) => (
              <Row key={f.id} last={i === chosen.length - 1}>
                <FoodDisc emoji={f.emoji} size={40} />
                <Text className="flex-1 text-[16px] font-bold text-ink">{foodName(f)}</Text>
                <Pressable accessibilityRole="button" onPress={() => setFoodIds(foodIds.filter((x) => x !== f.id))} className="h-10 w-10 items-center justify-center">
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
