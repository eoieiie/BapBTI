// 4 결과 카드 — 브랜드가 실리는 유일한 화면 (DECISIONS #10 예외). 스크린샷 한 장이 목적.
// 원칙: 면 하나(음식별 고정색) + 잉크 한 색 + 숫자 하나 크게. 선·그라데이션·아이콘 없음.
// 병주 스케치 오면 여기만 바꾼다.
import { Text, View } from 'react-native';

import { foodColor } from '../lib/foodColor';
import { isKo, t } from '../lib/i18n';

export interface CardData {
  foodId: string;
  groupName: string;
  date: string;
  foodKo: string;
  foodEn: string;
  others: string[]; // 나 빼고 같이 먹은 사람
  pairLines: { name: string; n: number }[]; // "A랑 n번째", n 내림차순
  groupNth: number;
  myNth: number;
}


/** 카드에서 제일 크게 보여줄 숫자 하나. 관계 > 모임 > 나. 전부 1이면 "첫". */
function hero(d: CardData): { n: number; caption: string } {
  const top = d.pairLines[0];
  if (top && top.n >= 2) return { n: top.n, caption: t('card.heroPair', { name: top.name }) };
  if (d.groupNth >= 2) return { n: d.groupNth, caption: t('card.heroGroup', { food: d.foodKo }) };
  if (d.myNth >= 2) return { n: d.myNth, caption: t('card.heroMine', { food: d.foodKo }) };
  return { n: 1, caption: t('card.heroFirst', { food: d.foodKo }) };
}

export function ResultCard({ d }: { d: CardData }) {
  const bg = foodColor(d.foodId);
  const h = hero(d);
  const primary = isKo() ? d.foodKo : d.foodEn;
  const secondary = isKo() ? d.foodEn : d.foodKo;
  return (
    <View className="overflow-hidden rounded-[28px] px-6 pb-6 pt-6" style={{ backgroundColor: bg, aspectRatio: 4 / 5 }}>
      <Text className="text-[13px] font-bold text-ink/70">{d.groupName} · {d.date}</Text>

      <View className="mt-10">
        <Text className="text-[44px] font-bold leading-[50px] text-ink" numberOfLines={3} adjustsFontSizeToFit>{primary}</Text>
        <Text className="mt-2 text-[16px] font-bold text-ink/60">{secondary}</Text>
      </View>

      <View className="flex-1" />

      <View className="flex-row items-end justify-between">
        <View>
          <View className="flex-row items-end">
            <Text className="text-[64px] font-bold leading-[64px] text-ink">{h.n}</Text>
            <Text className="mb-2 ml-1 text-[20px] font-bold text-ink">{t('common.nthSuffix')}</Text>
          </View>
          <Text className="mt-1 text-[15px] font-bold text-ink/70">{h.caption}</Text>
        </View>
        <View className="items-end">
          <View className="flex-row">
            {d.others.slice(0, 5).map((name, i) => (
              <View key={name} className="h-8 w-8 items-center justify-center rounded-full bg-ink" style={{ marginLeft: i === 0 ? 0 : -6 }}>
                <Text className="text-[13px] font-bold" style={{ color: bg }}>{name.trim().slice(0, 1).toUpperCase()}</Text>
              </View>
            ))}
          </View>
          <Text className="mt-3 text-[11px] font-bold text-ink/50">밥비티아이</Text>
        </View>
      </View>
    </View>
  );
}
