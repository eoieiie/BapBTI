// 세션 1단계 — 후보 모으기. 내 못 먹는 것이 항상 보이고 거기서 바로 고칠 수 있다.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useAddCandidate, useRemoveCandidate, useSetPitch, type LiveSession } from '../../hooks/useLiveSession';
import { useMyRestrictions } from '../../hooks/useMyRestrictions';
import { foodName, t } from '../../lib/i18n';
import type { FoodRow } from '../../types/db';
import { Card, FoodDisc, Hint, Input, NO_OUTLINE, Row, Section } from '../ui';

const PITCH_MAX = 60;
const SUGGESTIONS = 6;

export function CandidatePhase({ live, foods }: { live: LiveSession; foods: FoodRow[] }) {
  const router = useRouter();
  const sessionId = live.session.id;
  const add = useAddCandidate(sessionId);
  const remove = useRemoveCandidate(sessionId);
  const setPitch = useSetPitch(sessionId);
  const myTags = useMyRestrictions().data?.tags ?? [];
  const [search, setSearch] = useState('');
  const [pitchFor, setPitchFor] = useState<string | null>(null); // 어필 편집 중인 food_id
  const [pitchDraft, setPitchDraft] = useState('');

  const taken = useMemo(() => new Set(live.candidates.map((c) => c.food_id)), [live.candidates]);
  const suggestions = useMemo(() => {
    const s = search.trim().toLowerCase();
    const pool = foods.filter((f) => !taken.has(f.id));
    if (!s) return pool.slice(0, SUGGESTIONS);
    return pool.filter((f) => f.name.includes(s) || f.name_en.toLowerCase().includes(s)).slice(0, SUGGESTIONS);
  }, [search, foods, taken]);

  const commitPitch = (foodId: string) => {
    setPitch.mutate({ foodId, pitch: pitchDraft });
    setPitchFor(null);
  };

  return (
    <>
      <Card className="mt-4 py-1">
        <Row onPress={() => router.push({ pathname: '/restrictions' })} last>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="ban-outline" size={17} color="#1C1C1E" />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-ink">{t('restrictions.title')}</Text>
            <Hint className="mt-0.5">{myTags.length ? myTags.map((tag) => t(`restrictions.tag.${tag}`)).join(' · ') : t('restrictions.none')}</Hint>
          </View>
          <Ionicons name="chevron-forward" size={17} color="#8E8E93" />
        </Row>
      </Card>

      {live.candidates.length > 0 && (
        <>
          <Section>{t('session.candidates')}</Section>
          <Card className="py-1">
            {live.candidates.map((c, i) => {
              const mine = !!live.me && c.proposed_by === live.me.id;
              const editing = pitchFor === c.food_id;
              return (
                <Row key={c.id} last={i === live.candidates.length - 1} className="items-start">
                  <FoodDisc foodId={c.food_id} size={40} dim={!!c.vetoed_by} />
                  <View className="flex-1">
                    <Text className={`text-[16px] font-bold ${c.vetoed_by ? 'text-sub line-through' : 'text-ink'}`}>{foodName(c.foods)}</Text>
                    {c.pitch && !editing && <Text className="mt-0.5 text-[14px] text-ink">{`“${c.pitch}”`}</Text>}
                    <Hint className="mt-0.5">
                      {c.vetoed_by ? t('session.vetoed') : t('session.proposedBy', { name: live.nameOf(c.proposed_by) })}
                    </Hint>

                    {mine && editing && (
                      <TextInput
                        autoFocus
                        value={pitchDraft}
                        onChangeText={setPitchDraft}
                        maxLength={PITCH_MAX}
                        placeholder={t('session.pitchPlaceholder')}
                        placeholderTextColor="#8E8E93"
                        style={NO_OUTLINE}
                        onBlur={() => commitPitch(c.food_id)}
                        onSubmitEditing={() => commitPitch(c.food_id)}
                        className="mt-2 h-10 rounded-xl bg-gray-100 px-3 text-[14px] text-ink"
                      />
                    )}
                    {mine && !editing && (
                      <View className="mt-1.5 flex-row gap-4">
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t('session.writePitch')}
                          onPress={() => { setPitchDraft(c.pitch ?? ''); setPitchFor(c.food_id); }}
                          className="active:opacity-60">
                          <Text className="text-[13px] font-bold text-ink">{c.pitch ? t('session.writePitch') : `+ ${t('session.writePitch')}`}</Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={t('session.remove')} onPress={() => remove.mutate(c.food_id)} className="active:opacity-60">
                          <Text className="text-[13px] font-bold text-sub">{t('session.remove')}</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </Row>
              );
            })}
          </Card>
        </>
      )}

      <Input value={search} onChangeText={setSearch} placeholder={`${t('session.addCandidate')} · ${t('session.search')}`} className="mt-3" />
      {suggestions.length > 0 && (
        <Card className="mt-2 py-1">
          {suggestions.map((f, i) => (
            <Row key={f.id} onPress={() => { add.mutate({ foodId: f.id }); setSearch(''); }} last={i === suggestions.length - 1}>
              <FoodDisc foodId={f.id} size={40} />
              <Text className="flex-1 text-[16px] text-ink">{foodName(f)}</Text>
              <Ionicons name="add" size={20} color="#8E8E93" />
            </Row>
          ))}
        </Card>
      )}
    </>
  );
}
