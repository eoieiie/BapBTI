// 떠 있는 탭바. 화면 끝에 붙지 않고 내용 위에 얹힌다 — 테두리 대신 흰 면 + 옅은 그림자.
// 아이콘만 두고 라벨은 뺐다. 현재 탭은 회색 알약으로 표시한다.
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** 탭바가 가리는 높이 — 탭 화면의 스크롤 바닥 여백에 쓴다. */
export const TAB_BAR_SPACE = 92;

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  index: { on: 'people', off: 'people-outline' },
  me: { on: 'person', off: 'person-outline' },
  settings: { on: 'settings', off: 'settings-outline' },
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 items-center" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View
        className="flex-row rounded-full bg-white p-1.5"
        style={
          Platform.OS === 'android'
            ? { elevation: 8 }
            : { shadowColor: '#1C1C1E', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } }
        }>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const icon = ICONS[route.name] ?? ICONS.index;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              className={`h-12 w-[68px] items-center justify-center rounded-full ${focused ? 'bg-gray-100' : ''} active:opacity-60`}>
              <Ionicons name={focused ? icon.on : icon.off} size={23} color={focused ? '#1C1C1E' : '#8E8E93'} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
