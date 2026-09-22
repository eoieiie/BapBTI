// 세션 2단계 — 투표. 누가 뭘 찍었는지는 아무도 못 본다. 표 수도 투표 중엔 안 보여준다.
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useCastVote, type LiveSession } from '../../hooks/useLiveSession';
import { foodName, t } from '../../lib/i18n';
import { Card, FoodDisc, Hint, Row, Section } from '../ui';

export function VotingPhase({ live }: { live: LiveSession }) {
  const vote = useCastVote(live.session.id);
  const open = live.candidates.filter((c) => !c.vetoed_by);
  const vetoed = live.candidates.filter((c) => c.vetoed_by);

  return (
    <>
      <Section>{t('session.pickUpTo')}</Section>
      <Hint className="mb-2">{t('session.anonymous')}</Hint>

      <Card className="py-1">
        {open.map((c, i) => {
          const on = live.myVotes.includes(c.food_id);
          return (
            <Row key={c.id} onPress={() => !vote.isPending && vote.mutate(c.food_id)} last={i === open.length - 1}>
              <FoodDisc foodId={c.food_id} size={40} />
              <View className="flex-1">
                <Text className={`text-[17px] text-ink ${on ? 'font-bold' : ''}`}>{foodName(c.foods)}</Text>
                {c.pitch && <Text className="mt-0.5 text-[14px] text-ink" numberOfLines={2}>{`“${c.pitch}”`}</Text>}
                <Hint className="mt-0.5">{live.nameOf(c.proposed_by)}</Hint>
              </View>
              <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={on ? '#1C1C1E' : '#D1D5DB'} />
            </Row>
          );
        })}
      </Card>

      {vetoed.length > 0 && (
        <Hint className="mt-2">{vetoed.map((c) => `${c.foods.name} · ${live.nameOf(c.vetoed_by!)}`).join(' / ')}</Hint>
      )}
      {vote.isError && <Hint className="mt-1">{vote.error.message.includes('max') ? t('session.maxVotes') : vote.error.message}</Hint>}

      <Card className="mt-3 py-4">
        <Text className="text-[14px] font-bold text-ink">{t('session.voted', { done: live.votedMembers, total: live.participants.length })}</Text>
        <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <View className="h-full rounded-full bg-ink" style={{ width: `${live.participants.length ? Math.round((live.votedMembers / live.participants.length) * 100) : 0}%` }} />
        </View>
      </Card>
    </>
  );
}
