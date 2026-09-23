// 하단 탭. 탭을 누르면 그 탭이 있던 자리로 돌아간다 (새로 쌓이지 않음).
// 탭바는 화면 위에 떠 있는 형태 — components/FloatingTabBar.
import { Tabs } from 'expo-router';

import { FloatingTabBar } from '../../components/FloatingTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#F2F4F6' } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="me" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
