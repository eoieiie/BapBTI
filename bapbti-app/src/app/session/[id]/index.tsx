// 3 세션 — 한 화면에서 open → voting → done. Realtime 으로 전원이 같은 상태를 본다.
// 단계별 화면은 components/session/*, 결정 규칙은 서버(0004_rpc.sql).
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';

import { CandidatePhase } from '../../../components/session/CandidatePhase';
import { ResultPhase } from '../../../components/session/ResultPhase';
import { VotingPhase } from '../../../components/session/VotingPhase';
import { Avatar, Bottom, Button, ErrorBox, Header, Hint, Loading, Screen } from '../../../components/ui';
import { useFoods } from '../../../hooks/useGroups';
import { useJoinSession, useLiveSession, useOpenVoting, useSpin } from '../../../hooks/useLiveSession';
import { humanError, t } from '../../../lib/i18n';

export default function Session() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useLiveSession(id);
  const join = useJoinSession(id);
  const openVoting = useOpenVoting(id);
  const spin = useSpin(id, q.data?.session.group_id);
  const foods = useFoods(q.data?.session.group_id);

  // 화면에 들어오면 참여자로 등록한다 — 참여자 목록이 거부권의 범위다.
  const live = q.data;
  const needsJoin = !!live && !!live.me && live.session.status !== 'done' && !live.participants.some((p) => p.member_id === live.me!.id);
  useEffect(() => {
    if (needsJoin && !join.isPending) join.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsJoin]);

  if (q.isError) return <Screen><ErrorBox message={humanError(q.error.message)} onRetry={() => q.refetch()} /></Screen>;
  if (!q.data) return <Screen><Loading /></Screen>;

  const { session, members, participants, candidates, isHost } = q.data;
  const votable = candidates.filter((c) => !c.vetoed_by).length;

  return (
    <Screen>
      <Header title={t('session.title')} back chip={t(`session.status.${session.status}`)} />

      {session.status === 'done' ? (
        <>
          <ResultPhase live={q.data} />
          <Bottom>
            <Button label={t('session.toCard')} primary onPress={() => router.push({ pathname: '/session/[id]/card', params: { id: session.id } })} />
          </Bottom>
        </>
      ) : (
        <>
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="flex-row flex-wrap gap-1">
              {members.map((m) => (
                <Avatar key={m.id} name={m.display_name} size={36} dim={!participants.some((p) => p.member_id === m.id)} />
              ))}
            </View>
            <Hint className="mt-1">{t('session.participants', { n: `${participants.length}/${members.length}` })}</Hint>

            {session.status === 'open' ? <CandidatePhase live={q.data} foods={foods.data ?? []} /> : <VotingPhase live={q.data} />}
            <View className="h-4" />
          </ScrollView>

          <Bottom>
            {isHost && session.status === 'open' && (
              <>
                <Button label={t('session.startVoting')} primary disabled={votable === 0} loading={openVoting.isPending} onPress={() => openVoting.mutate()} />
                <Hint className="mt-2 text-center">{t('session.hostOnly')}</Hint>
              </>
            )}
            {isHost && session.status === 'voting' && (
              <>
                <Button label={t('session.spin')} primary disabled={q.data.wheel.wheelFoods.length === 0} loading={spin.isPending} onPress={() => spin.mutate()} />
                <Hint className="mt-2 text-center">{spin.isError ? spin.error.message : t('session.spinHint')}</Hint>
              </>
            )}
            {!isHost && (
              <Hint className="text-center">
                {session.status === 'open' ? t('session.status.open') : t('session.voted', { done: q.data.votedMembers, total: participants.length })}
              </Hint>
            )}
          </Bottom>
        </>
      )}
    </Screen>
  );
}
