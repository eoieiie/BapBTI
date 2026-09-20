// 5 내 밥비티아이 — 전부 meals 파생
import { ScrollView, Text, View } from 'react-native';

import { Avatar, BottomBar, Card, ErrorBox, FoodDisc, Hint, Loading, Row, Screen, Section, Title } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { foodName, t } from '../lib/i18n';

const TYPE_COLOR: Record<string, string> = { authority: '#B23A2A', explorer: '#2A6FB2', balanced: '#6B7A3A', unknown: '#8E8E93' };

export default function Me() {
  const me = useMe();
  return (
    <Screen>
      <Title>{t('me.title')}</Title>
      {me.isPending ? (
        <Loading />
      ) : me.isError ? (
        <ErrorBox message={me.error.message} onRetry={() => me.refetch()} />
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* 타입 — 이 카드 하나만 색을 가진다 */}
          <Card>
            <Hint>{t('me.typeLabel')}</Hint>
            <Text className="mt-1 text-[32px] font-bold" style={{ color: TYPE_COLOR[me.data.type] }}>{t(`me.types.${me.data.type}`)}</Text>
            <Hint className="mt-1">{t(`me.typeHint.${me.data.type}`)}</Hint>
            <View className="mt-5">
              <View className="flex-row justify-between">
                <Hint>{t('me.axisRepeat')}</Hint>
                <Hint>{t('me.axisExplore')}</Hint>
              </View>
              <View className="mt-2 h-1.5 rounded-full bg-gray-100">
                {me.data.ratio !== null && (
                  <View className="absolute -top-[7px] h-5 w-5 rounded-full" style={{ left: `${Math.round(me.data.ratio * 100)}%`, marginLeft: -10, backgroundColor: TYPE_COLOR[me.data.type] }} />
                )}
              </View>
            </View>
          </Card>

          <Card className="mt-3 flex-row">
            <Stat n={String(me.data.total)} label={t('me.total')} />
            <Stat n={me.data.top ? `${me.data.top.food.emoji} ${me.data.top.n}` : '–'} label={me.data.top ? foodName(me.data.top.food) : t('me.top')} />
            <Stat n={String(me.data.distinct)} label={t('me.distinct')} />
          </Card>

          {me.data.total === 0 && <Hint className="mt-6 text-center">{t('me.noMeals')}</Hint>}

          <Section>{t('me.dogam', { n: me.data.distinct, total: me.data.catalogSize })}</Section>
          <Card className="flex-row flex-wrap gap-2.5">
            {me.data.eatenFoods.map((f) => <FoodDisc key={f.id} emoji={f.emoji} size={48} />)}
            {me.data.eatenFoods.length === 0 && <Hint>–</Hint>}
          </Card>

          {me.data.people.length > 0 && (
            <>
              <Section>{t('me.people')}</Section>
              <Card className="py-1">
                {me.data.people.map((p, i) => (
                  <Row key={p.member.id} last={i === me.data.people.length - 1}>
                    <Avatar name={p.member.display_name} size={36} />
                    <Text className="flex-1 text-[16px] text-ink">{p.member.display_name}</Text>
                    <Hint>{t('me.times', { n: p.n })}</Hint>
                  </Row>
                ))}
              </Card>
            </>
          )}
          <View className="h-6" />
        </ScrollView>
      )}
      <BottomBar active="me" />
    </Screen>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[22px] font-bold text-ink" numberOfLines={1}>{n}</Text>
      <Hint numberOfLines={1}>{label}</Hint>
    </View>
  );
}
