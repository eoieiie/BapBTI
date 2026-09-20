// 룰렛 휠 — 연출만. 결과는 서버(spin_roulette)가 정한다 (DECISIONS #8).
// 균등 분할. 가중치가 결정되면(미확정 큐 7) 조각 크기를 표 수로 바꾼다.
import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

const R = 140;
const C = 150;
const FILLS = ['#FFFFFF', '#E5E8EB'];

function arc(a0: number, a1: number) {
  const x0 = C + R * Math.cos(a0), y0 = C + R * Math.sin(a0);
  const x1 = C + R * Math.cos(a1), y1 = C + R * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${C},${C} L${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
}

export function Wheel({ labels, winnerIndex, onDone }: { labels: string[]; winnerIndex: number | null; onDone?: () => void }) {
  const [spin] = useState(() => new Animated.Value(0)); // useRef(...).current 는 react-compiler 린트에 걸린다
  const n = Math.max(labels.length, 1);
  const seg = (2 * Math.PI) / n;

  useEffect(() => {
    if (winnerIndex === null) return;
    // 포인터는 위(−90°). i번째 조각 중심이 위로 오도록 회전 + 5바퀴
    const target = 360 * 5 + (360 - ((winnerIndex + 0.5) * 360) / n);
    spin.setValue(0);
    Animated.timing(spin, { toValue: target, duration: 3200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) onDone?.();
    });
  }, [winnerIndex, n, spin, onDone]);

  const rotate = spin.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });

  return (
    <View className="items-center">
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={300} height={300} viewBox="0 0 300 300">
          {labels.map((label, i) => {
            const a0 = -Math.PI / 2 + i * seg, a1 = a0 + seg, am = (a0 + a1) / 2;
            const tx = C + 85 * Math.cos(am), ty = C + 85 * Math.sin(am);
            return (
              <G key={label + i}>
                <Path d={n === 1 ? `M${C - R},${C} a${R},${R} 0 1,0 ${2 * R},0 a${R},${R} 0 1,0 -${2 * R},0` : arc(a0, a1)} fill={FILLS[i % 2]} />
                <SvgText x={tx} y={ty} fontSize={15} fontWeight="bold" fill="#1C1C1E" textAnchor="middle" alignmentBaseline="middle"
                  transform={`rotate(${(am * 180) / Math.PI + 90} ${tx} ${ty})`}>
                  {label.length > 8 ? label.slice(0, 8) + '…' : label}
                </SvgText>
              </G>
            );
          })}
          <Circle cx={C} cy={C} r={14} fill="#F2F4F6" />
        </Svg>
      </Animated.View>
      {/* 포인터 (고정) */}
      <Svg width={300} height={30} viewBox="0 0 300 30" style={{ position: 'absolute', top: -6 }}>
        <Path d="M150,2 L138,26 L162,26 Z" fill="#E4572E" />
      </Svg>
    </View>
  );
}
