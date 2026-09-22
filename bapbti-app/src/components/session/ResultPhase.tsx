// 세션 3단계 — 룰렛과 결과. 결과는 이미 서버가 정했고 여기서는 보여주기만 한다.
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import type { LiveSession } from '../../hooks/useLiveSession';
import { foodColor } from '../../lib/foodColor';
import { foodName, t } from '../../lib/i18n';
import { Reveal } from '../Reveal';
import { SPIN_MS, Wheel } from '../Wheel';

export function ResultPhase({ live }: { live: LiveSession }) {
  const [done, setDone] = useState(false);
  const onDone = useCallback(() => setDone(true), []);

  // 화면이 백그라운드면 애니메이션 콜백이 안 와서 결과가 영영 안 뜬다 — 시간으로 한 번 더 건다.
  useEffect(() => {
    const timer = setTimeout(() => setDone(true), SPIN_MS + 400);
    return () => clearTimeout(timer);
  }, []);

  const { wheelFoods, winnerIndex, decidedFood } = live.wheel;

  return (
    <View className="flex-1 items-center justify-center">
      <Wheel labels={wheelFoods.map((f) => f.name)} colors={wheelFoods.map((f) => foodColor(f.id))} winnerIndex={winnerIndex} onDone={onDone} />
      <View className="mt-8 min-h-[100px] w-full items-center justify-center px-2">
        {done && decidedFood ? (
          <Reveal>
            <Text className="text-center text-[34px] font-bold leading-[40px] text-ink" numberOfLines={2} adjustsFontSizeToFit>
              {foodName(decidedFood)}
            </Text>
          </Reveal>
        ) : (
          <Text className="text-[22px] font-bold text-sub">{t('session.spinning')}</Text>
        )}
      </View>
    </View>
  );
}
