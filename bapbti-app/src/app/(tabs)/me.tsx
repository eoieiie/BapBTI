// 내 밥비티아이 — 프로필. 자랑할 수 있게 한 장으로 공유된다. 전부 meals 파생.
import { TAB_BAR_SPACE } from '../../components/FloatingTabBar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';

import { Avatar, Button, Card, ErrorBox, FoodDisc, Hint, Loading, Row, Screen, Section, Title } from '../../components/ui';
import { useMe } from '../../hooks/useMe';
import { useMyRestrictions } from '../../hooks/useMyRestrictions';
import { useProfile } from '../../hooks/useProfile';
import { hasTakenQuiz, typeCode } from '../../lib/quiz';
import { level } from '../../lib/bapbti';
import { foodColor } from '../../lib/foodColor';
import { foodName, humanError, t } from '../../lib/i18n';

const TYPE_COLOR: Record<string, string> = { authority: '#B23A2A', explorer: '#2A6FB2', balanced: '#6B7A3A', unknown: '#8E8E93' };

export default function Me() {
  const me = useMe();
  const router = useRouter();
  const restrictions = useMyRestrictions();
  const profile = useProfile();
  const shot = useRef<ViewShotRef>(null);
  const [sharing, setSharing] = useState(false);

  if (me.isError) return <Screen><ErrorBox message={humanError(me.error.message)} onRetry={() => me.refetch()} /></Screen>;
  if (!me.data) return <Screen><Loading /></Screen>;

  const d = me.data;
  const lv = level(d.total);
  const quizDone = hasTakenQuiz(profile.data?.axes);
  const code = quizDone ? typeCode(profile.data?.axes) : null;
  // 네 글자가 정체성이고, 최다 음식은 그 아래 한 줄로 붙는다
  const subtitle = d.top && d.top.n >= 3 ? t('me.authority', { food: foodName(d.top.food) }) : null;
  const accent = d.top && d.top.n >= 3 ? foodColor(d.top.food.id) : TYPE_COLOR[d.type];
  const tags = restrictions.data?.tags ?? [];

  const share = async () => {
    const text = [code ?? '', subtitle ?? '', t('me.total') + ' ' + d.total, t('me.dogam', { n: d.distinct, total: d.catalogSize }), '— 밥비티아이'].join('\n');
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

  return (
    <Screen>
      <Title>{t('me.title')}</Title>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
        {/* 자랑용 한 장 — 이 영역이 그대로 이미지로 나간다 */}
        <ViewShot ref={shot} options={{ format: 'png', quality: 1 }} style={{ backgroundColor: '#F2F4F6' }}>
          <Card>
            <View className="flex-row items-end justify-between">
              <Text className="text-[13px] font-bold" style={{ color: accent }}>{t('me.level', { n: lv.level })}</Text>
              <Hint>{t('me.levelNeed', { n: lv.need - lv.into, next: lv.level + 1 })}</Hint>
            </View>
            <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <View className="h-full rounded-full" style={{ width: `${Math.round((lv.into / lv.need) * 100)}%`, backgroundColor: accent }} />
            </View>

            {code ? (
              <Text className="mt-5 text-[46px] font-bold tracking-[3px] text-ink">{code}</Text>
            ) : (
              <Pressable onPress={() => router.push({ pathname: '/onboarding' })} className="mt-5 active:opacity-70">
                <Text className="text-[26px] font-bold text-ink">{t('me.takeQuiz')}</Text>
                <Hint className="mt-1">{t('me.takeQuizHint')}</Hint>
              </Pressable>
            )}
            <Text className="mt-1 text-[15px] font-bold text-sub" numberOfLines={1}>
              {[profile.data?.handle ? `@${profile.data.handle}` : profile.data?.display_name, subtitle].filter(Boolean).join(' · ')}
            </Text>

            <View className="mt-6 flex-row">
              <Stat n={String(d.total)} label={t('me.total')} />
              <Stat n={String(d.distinct)} label={t('me.distinct')} />
              <Stat n={String(d.people.length)} label={t('me.people')} />
            </View>

            {d.eatenFoods.length > 0 && (
              <View className="mt-6 flex-row flex-wrap gap-2">
                {d.eatenFoods.slice(0, 18).map((f) => <FoodDisc key={f.id} foodId={f.id} size={26} />)}
              </View>
            )}
            <Text className="mt-5 text-right text-[11px] font-bold text-sub">밥비티아이</Text>
          </Card>
        </ViewShot>

        {d.total === 0 && <Hint className="mt-4 text-center">{t('me.noMeals')}</Hint>}

        {d.total > 0 && (
          <>
            <Section>{t('me.dogam', { n: d.distinct, total: d.catalogSize })}</Section>
            <Card className="flex-row flex-wrap gap-2.5">
              {d.eatenFoods.map((f) => (
                <View key={f.id} className="items-center" style={{ width: 52 }}>
                  <FoodDisc foodId={f.id} size={40} />
                  <Text numberOfLines={1} className="mt-1 text-[10px] text-sub">{f.name}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {d.people.length > 0 && (
          <>
            <Section>{t('me.people')}</Section>
            <Card className="py-1">
              {d.people.map((p, i) => (
                <Row key={p.member.id} last={i === d.people.length - 1}>
                  <Avatar name={p.member.display_name} size={34} label={false} />
                  <Text className="flex-1 text-[16px] text-ink">{p.member.display_name}</Text>
                  <Hint>{t('me.times', { n: p.n })}</Hint>
                </Row>
              ))}
            </Card>
          </>
        )}

        <Section>{t('restrictions.mine')}</Section>
        <Card className="py-1">
          <Row onPress={() => router.push({ pathname: '/restrictions' })} last>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="ban-outline" size={17} color="#1C1C1E" />
            </View>
            <Text className="flex-1 text-[15px] text-ink" numberOfLines={1}>
              {tags.length ? tags.map((tg: string) => t(`restrictions.tag.${tg}`)).join(' · ') : t('restrictions.none')}
            </Text>
            <Ionicons name="chevron-forward" size={17} color="#8E8E93" />
          </Row>
        </Card>

        <Button label={t('me.shareProfile')} className="mb-8 mt-5" loading={sharing} onPress={share} />
      </ScrollView>
    </Screen>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <View className="flex-1">
      <Text className="text-[26px] font-bold text-ink">{n}</Text>
      <Hint numberOfLines={1}>{label}</Hint>
    </View>
  );
}
