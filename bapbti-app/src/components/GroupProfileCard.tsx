// 모임 프로필 — 총무가 한눈에. 누가가 아니라 몇 명.
import { Text, View } from 'react-native';

import type { GroupProfile } from '../hooks/useGroupProfile';
import { t } from '../lib/i18n';
import { AXES, AXIS_LETTERS } from '../lib/quiz';
import { Card, Hint } from './ui';

export function GroupProfileCard({ data }: { data: GroupProfile }) {
  const hasRestrictions = data.restrictions.length > 0 || data.foodVetoPeople > 0;

  return (
    <Card>
      <Text className="text-[13px] font-bold text-sub">{t('group.profileTitle')}</Text>

      {/* 못 먹는 것 — 여기가 총무가 제일 먼저 봐야 하는 줄 */}
      <View className="mt-3">
        {hasRestrictions ? (
          <View className="flex-row flex-wrap gap-2">
            {data.restrictions.map((r) => (
              <View key={r.tag} className="flex-row items-baseline rounded-full bg-gray-100 px-3 py-1.5">
                <Text className="text-[14px] font-bold text-ink">{t(`restrictions.tag.${r.tag}`)}</Text>
                <Text className="ml-1.5 text-[13px] text-sub">{t('group.peopleCount', { n: r.count })}</Text>
              </View>
            ))}
            {data.foodVetoPeople > 0 && (
              <View className="flex-row items-baseline rounded-full bg-gray-100 px-3 py-1.5">
                <Text className="text-[14px] font-bold text-ink">{t('group.specificFoods')}</Text>
                <Text className="ml-1.5 text-[13px] text-sub">{t('group.peopleCount', { n: data.foodVetoPeople })}</Text>
              </View>
            )}
          </View>
        ) : (
          <Text className="text-[16px] font-bold text-ink">{t('group.noRestrictions')}</Text>
        )}
        <Hint className="mt-2">{t('group.restrictionsHint')}</Hint>
      </View>

      {/* 입맛 쏠림 — 테스트한 사람이 있을 때만 */}
      {data.quizzed > 0 && (
        <View className="mt-5 gap-2">
          {AXES.map((a) => {
            const { pos, neg } = data.lean[a];
            const total = pos + neg;
            if (total === 0) return null;
            const posShare = pos / total;
            return (
              <View key={a} className="flex-row items-center gap-3">
                <Text className="w-5 text-center text-[14px] font-bold text-ink">{AXIS_LETTERS[a].pos}</Text>
                <View className="h-2 flex-1 flex-row overflow-hidden rounded-full bg-gray-100">
                  <View className="h-full bg-ink" style={{ width: `${Math.round(posShare * 100)}%` }} />
                </View>
                <Text className="w-5 text-center text-[14px] font-bold text-sub">{AXIS_LETTERS[a].neg}</Text>
              </View>
            );
          })}
          <Hint className="mt-1">{t('group.leanHint', { n: data.quizzed, total: data.claimed })}</Hint>
        </View>
      )}
    </Card>
  );
}
