// 룰렛 휠 — 연출만. 결과는 서버(spin_roulette)가 정한다 (DECISIONS #8).
// 조각 = 음식별 고정색, 크기 = 표 수(weights), 라벨은 항상 똑바로(회전 안 함), 포인터는 둥근 물방울. 멈출 때 햅틱.
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

const R = 140;
const C = 150;
export const SPIN_MS = 3600;

function arc(a0: number, a1: number) {
  const x0 = C + R * Math.cos(a0), y0 = C + R * Math.sin(a0);
  const x1 = C + R * Math.cos(a1), y1 = C + R * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${C},${C} L${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
}

const tick = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
const land = () => { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };

export function Wheel({ labels, colors, weights, winnerIndex, onDone }: { labels: string[]; colors: string[]; weights?: number[]; winnerIndex: number | null; onDone?: () => void }) {
  const [spin] = useState(() => new Animated.Value(0));
  const n = Math.max(labels.length, 1);
  // 조각 i 의 시작·끝 (0~1 비율). weights 없으면 균등.
  const w = labels.map((_, i) => weights?.[i] ?? 1);
  const total = w.reduce((a, b) => a + b, 0) || 1;
  const starts = w.map((_, i) => w.slice(0, i).reduce((a, b) => a + b, 0) / total);
  const ends = starts.map((s0, i) => s0 + w[i] / total);
  const wKey = w.join(',');
  const lastTick = useRef(0);

  useEffect(() => {
    if (winnerIndex === null) return;
    const mid = (starts[winnerIndex] + ends[winnerIndex]) / 2;
    const target = 360 * 5 + (360 - mid * 360);
    spin.setValue(0);
    // 조각 경계를 지날 때마다 톡 — 속도가 줄면서 간격이 벌어진다
    const sub = spin.addListener(({ value }) => {
      const frac = 1 - ((value % 360) / 360);
      const k = Math.floor(value / 360) * n + starts.filter((s0) => s0 <= frac).length;
      if (k !== lastTick.current) { lastTick.current = k; tick(); }
    });
    Animated.timing(spin, { toValue: target, duration: SPIN_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      spin.removeListener(sub);
      if (finished) { land(); onDone?.(); }
    });
    return () => spin.removeListener(sub);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- starts/ends 는 wKey 로 대신 추적
  }, [winnerIndex, n, wKey, spin, onDone]);

  const rotate = spin.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  // 라벨은 휠과 반대로 돌려서 항상 똑바로 보이게
  const counter = spin.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '-360deg'] });

  return (
    <View className="items-center" style={{ width: 300, height: 300 }}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={300} height={300} viewBox="0 0 300 300">
          {labels.map((_, i) => {
            const a0 = -Math.PI / 2 + starts[i] * 2 * Math.PI, a1 = -Math.PI / 2 + ends[i] * 2 * Math.PI;
            return <Path key={i} d={n === 1 ? `M${C - R},${C} a${R},${R} 0 1,0 ${2 * R},0 a${R},${R} 0 1,0 -${2 * R},0` : arc(a0, a1)} fill={colors[i] ?? '#E5E8EB'} />;
          })}
          <Circle cx={C} cy={C} r={16} fill="#F2F4F6" />
        </Svg>
      </Animated.View>
      {/* 라벨 레이어: 위치는 휠과 같이 돌고, 글자는 역회전으로 똑바로 */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 300, height: 300, transform: [{ rotate }] }}>
        {labels.map((label, i) => {
          const am = -Math.PI / 2 + ((starts[i] + ends[i]) / 2) * 2 * Math.PI;
          const x = C + 88 * Math.cos(am), y = C + 88 * Math.sin(am);
          return (
            <Animated.View key={label + i} style={{ position: 'absolute', left: x - 50, top: y - 14, width: 100, alignItems: 'center', transform: [{ rotate: counter }] }}>
              <Svg width={100} height={28}>
                <G>
                  <SvgText x={50} y={19} fontSize={15} fontWeight="bold" fill="#1C1C1E" textAnchor="middle">
                    {label.length > 7 ? label.slice(0, 7) + '…' : label}
                  </SvgText>
                </G>
              </Svg>
            </Animated.View>
          );
        })}
      </Animated.View>
      {/* 포인터: 둥근 물방울 */}
      <Svg width={40} height={44} viewBox="0 0 40 44" style={{ position: 'absolute', top: -14, left: 130 }}>
        <Path d="M20 42 C 12 30, 4 24, 4 16 a16 16 0 1 1 32 0 c0 8 -8 14 -16 26 z" fill="#E4572E" />
      </Svg>
    </View>
  );
}
