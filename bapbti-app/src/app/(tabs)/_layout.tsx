// 하단 탭. 탭을 누르면 그 탭이 있던 자리로 돌아간다 (새로 쌓이지 않음).
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { t } from '../../lib/i18n';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1C1C1E',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopWidth: 0, elevation: 0 },
        tabBarLabelStyle: { fontSize: 11 },
        sceneStyle: { backgroundColor: '#F2F4F6' },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.groups'), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="me"
        options={{ title: t('tabs.me'), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('tabs.settings'), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} /> }}
      />
    </Tabs>
  );
}
