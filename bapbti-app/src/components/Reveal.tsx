// 결과가 뜰 때 한 번 튀어오르는 연출. 스프링 하나.
import { useEffect, useState, type ReactNode } from 'react';
import { Animated } from 'react-native';

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(v, { toValue: 1, delay, friction: 5, tension: 90, useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View style={{ opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
      {children}
    </Animated.View>
  );
}
