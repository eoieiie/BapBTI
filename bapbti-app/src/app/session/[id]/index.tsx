// 3 세션 — 한 화면에서 open → voting → done. Realtime 으로 전원 동기화.
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Avatar, Bottom, Button, Card, ErrorBox, FoodDisc, Header, Hint, Input, Loading, NO_OUTLINE, Row, Screen, Section } from '../../../components/ui';
import { Reveal } from '../../../components/Reveal';
import { Wheel } from '../../../components/Wheel';
import { foodColor } from '../../../lib/foodColor';
import { useFoods } from '../../../hooks/useGroups';
import { useAddCandidate, useCastVote, useJoinSession, useLiveSession, useOpenVoting, useRemoveCandidate, useSetPitch, useSpin } from '../../../hooks/useLiveSession';
import { roulettePool, tally } from '../../../lib/decision';
import { foodName, t } from '../../../lib/i18n';

export default function Session() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useLiveSession(id);
  const join = useJoinSession(id);
  const add = useAddCandidate(id);
  const remove = useRemoveCandidate(id);
  const setPitch = useSetPitch(id);
  const [pitchFor, setPitchFor] = useState<string | null>(null); // 어필 편집 중인 food_id
  const [pitchDraft, setPitchDraft] = useState('');
  const openVoting = useOpenVoting(id);
  const vote = useCastVote(id);
  const spin = useSpin(id, q.data?.session.group_id);
  const foods = useFoods(q.data?.session.group_id);
  const [search, setSearch] = useState('');
  const [wheelDone, setWheelDone] = useState(false);

  const me = q.data?.me ?? null;
  const joined = !!me && !!q.data?.participants.some((p) => p.member_id === me.id);
  useEffect(() => {
    if (q.data && me && !joined && q.data.session.status !== 'done' && !join.isPending) join.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data?.session.id, me?.id, joined]);

  const onWheelDone = useCallback(() => setWheelDone(true), []);
  const status = q.data?.session.status;
  useEffect(() => {
    if (status !== 'done') return;
    const timer = setTimeout(() => setWheelDone(true), 3600); // 백그라운드 탭이면 rAF 콜백이 안 와서 보험
    return () => clearTimeout(timer);
  }, [status]);

  const hits = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s || !foods.data || !q.data) return [];
    const taken = new Set(q.data.candidates.map((c) => c.food_id));
    return foods.data.filter((f) => !taken.has(f.id) && (f.name.includes(s) || f.name_en.toLowerCase().includes(s))).slice(0, 6);
  }, [search, foods.data, q.data]);

  if (q.isPending) return <Screen><Loading /></Screen>;
  if (q.isError) return <Screen><ErrorBox message={q.error.message} onRetry={() => q.refetch()} /></Screen>;
  const { session, members, participants, candidates, votes, isHost } = q.data;
  const nameOf = (mid: string) => members.find((m) => m.id === mid)?.display_name ?? '?';
  const counts = tally(votes);
  const myVotes = me ? votes.filter((v) => v.member_id === me.id).map((v) => v.food_id) : [];
  const votedMembers = new Set(votes.map((v) => v.member_id)).size;
  const pool = roulettePool(candidates, votes);
  const poolFoods = pool.map((fid) => candidates.find((c) => c.food_id === fid)!.foods);
  const winnerIndex = session.decided_food_id ? pool.indexOf(session.decided_food_id) : null;
  const decidedFood = candidates.find((c) => c.food_id === session.decided_food_id)?.foods ?? null;
  const quick = (foods.data ?? []).filter((f) => !candidates.some((c) => c.food_id === f.id)).slice(0, 6);

  return (
    <Screen>
      <Header title={t('session.title')} back chip={t(`session.status.${session.status}`)} />

      {session.status === 'done' ? (
        <>
          <View className="flex-1 items-center justify-center">
            <Wheel labels={poolFoods.map((f) => f.name)} colors={poolFoods.map((f) => foodColor(f.id))} winnerIndex={winnerIndex} onDone={onWheelDone} />
            <View className="mt-8 min-h-[100px] w-full items-center justify-center px-2">
              {wheelDone && decidedFood ? (
                <Reveal>
                  <Text className="text-center text-[34px] font-bold leading-[40px] text-ink" numberOfLines={2} adjustsFontSizeToFit>{foodName(decidedFood)}</Text>
                </Reveal>
              ) : (
                <Text className="text-[22px] font-bold text-sub">{t('session.spinning')}</Text>
              )}
            </View>
          </View>
          <Bottom>
            <Button label={t('session.toCard')} primary disabled={!wheelDone} onPress={() => router.push({ pathname: '/session/[id]/card', params: { id: session.id } })} />
          </Bottom>
        </>
      ) : (
        <>
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="flex-row flex-wrap gap-1">
              {members.map((m) => <Avatar key={m.id} name={m.display_name} size={36} dim={!participants.some((p) => p.member_id === m.id)} />)}
            </View>
            <Hint className="mt-1">{t('session.participants', { n: `${participants.length}/${members.length}` })}</Hint>

            {session.status === 'open' && (
              <>
                <Section>{t('session.candidates')}</Section>
                {candidates.length > 0 && (
                  <Card className="py-1">
                    {candidates.map((c, i) => {
                      const mine = !!me && c.proposed_by === me.id;
                      const editing = pitchFor === c.food_id;
                      return (
                        <Row key={c.id} last={i === candidates.length - 1} className="items-start">
                          <FoodDisc foodId={c.food_id} size={40} dim={!!c.vetoed_by} />
                          <View className="flex-1">
                            <Text className={`text-[16px] font-bold ${c.vetoed_by ? 'text-sub line-through' : 'text-ink'}`}>{foodName(c.foods)}</Text>
                            {c.pitch && !editing && <Text className="mt-0.5 text-[14px] text-ink">{`“${c.pitch}”`}</Text>}
                            <Hint className="mt-0.5">{c.vetoed_by ? t('session.vetoed', { name: nameOf(c.vetoed_by) }) : t('session.proposedBy', { name: nameOf(c.proposed_by) })}</Hint>
                            {mine && editing && (
                              <TextInput
                                autoFocus
                                value={pitchDraft}
                                onChangeText={setPitchDraft}
                                maxLength={60}
                                placeholder={t('session.pitchPlaceholder')}
                                placeholderTextColor="#8E8E93"
                                style={NO_OUTLINE}
                                onBlur={() => { setPitch.mutate({ foodId: c.food_id, pitch: pitchDraft }); setPitchFor(null); }}
                                onSubmitEditing={() => { setPitch.mutate({ foodId: c.food_id, pitch: pitchDraft }); setPitchFor(null); }}
                                className="mt-2 h-10 rounded-xl bg-gray-100 px-3 text-[14px] text-ink"
                              />
                            )}
                            {mine && !editing && (
                              <View className="mt-1.5 flex-row gap-4">
                                <Pressable accessibilityRole="button" accessibilityLabel={t('session.writePitch')} onPress={() => { setPitchDraft(c.pitch ?? ''); setPitchFor(c.food_id); }} className="active:opacity-60">
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
                )}
                <Input value={search} onChangeText={setSearch} placeholder={`${t('session.addCandidate')} · ${t('session.search')}`} className="mt-3" />
                {(hits.length > 0 || (!search && quick.length > 0)) && (
                  <Card className="mt-2 py-1">
                    {(search ? hits : quick).map((f, i, arr) => (
                      <Row key={f.id} onPress={() => { add.mutate({ foodId: f.id }); setSearch(''); }} last={i === arr.length - 1}>
                        <FoodDisc foodId={f.id} size={40} />
                        <Text className="flex-1 text-[16px] text-ink">{foodName(f)}</Text>
                        {f.spice > 0 && <Hint className="tracking-[2px]">{'●'.repeat(f.spice)}</Hint>}
                        <Ionicons name="add" size={20} color="#8E8E93" />
                      </Row>
                    ))}
                  </Card>
                )}
              </>
            )}

            {session.status === 'voting' && (
              <>
                <Section>{t('session.pickUpTo')}</Section>
                <Card className="py-1">
                  {candidates.filter((c) => !c.vetoed_by).map((c, i, arr) => {
                    const on = myVotes.includes(c.food_id);
                    return (
                      <Row key={c.id} onPress={() => !vote.isPending && vote.mutate(c.food_id)} last={i === arr.length - 1}>
                        <FoodDisc foodId={c.food_id} size={40} />
                        <View className="flex-1">
                          <Text className={`text-[17px] ${on ? 'font-bold' : ''} text-ink`}>{foodName(c.foods)}</Text>
                          {c.pitch && <Text className="mt-0.5 text-[14px] text-ink" numberOfLines={2}>{`“${c.pitch}”`}</Text>}
                          <Hint className="mt-0.5">{nameOf(c.proposed_by)}</Hint>
                        </View>
                        <Hint className="mr-1">{counts[c.food_id] ?? 0}</Hint>
                        <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={on ? '#1C1C1E' : '#D1D5DB'} />
                      </Row>
                    );
                  })}
                </Card>
                {candidates.some((c) => c.vetoed_by) && (
                  <Hint className="mt-2">{candidates.filter((c) => c.vetoed_by).map((c) => `${c.foods.name} · ${nameOf(c.vetoed_by!)}`).join(' / ')}</Hint>
                )}
                {vote.isError && <Hint className="mt-1">{vote.error.message.includes('max') ? t('session.maxVotes') : vote.error.message}</Hint>}
                <Card className="mt-3 py-4">
                  <Text className="text-[14px] font-bold text-ink">{t('session.voted', { done: votedMembers, total: participants.length })}</Text>
                  <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <View className="h-full rounded-full bg-ink" style={{ width: `${participants.length ? Math.round((votedMembers / participants.length) * 100) : 0}%` }} />
                  </View>
                </Card>
              </>
            )}
            <View className="h-4" />
          </ScrollView>

          {isHost && session.status === 'open' && (
            <Bottom>
              <Button label={t('session.startVoting')} primary disabled={candidates.filter((c) => !c.vetoed_by).length === 0} loading={openVoting.isPending} onPress={() => openVoting.mutate()} />
              <Hint className="mt-2 text-center">{t('session.hostOnly')}</Hint>
            </Bottom>
          )}
          {isHost && session.status === 'voting' && (
            <Bottom>
              <Button label={t('session.spin')} primary disabled={pool.length === 0} loading={spin.isPending} onPress={() => spin.mutate()} />
              <Hint className="mt-2 text-center">{spin.isError ? spin.error.message : t('session.spinHint')}</Hint>
            </Bottom>
          )}
          {!isHost && (
            <Bottom>
              <Hint className="text-center">{session.status === 'open' ? t('session.status.open') : t('session.voted', { done: votedMembers, total: participants.length })}</Hint>
            </Bottom>
          )}
        </>
      )}
    </Screen>
  );
}
