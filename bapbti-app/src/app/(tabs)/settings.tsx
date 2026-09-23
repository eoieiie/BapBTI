// 설정 — 출시에 필요한 기본기. 계정 상태, 약관, 계정 삭제, 버전.
import { TAB_BAR_SPACE } from '../../components/FloatingTabBar';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Alert, Platform, ScrollView, Text, View } from 'react-native';

import { Card, Hint, Row, Screen, Section, Title } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/i18n';

export default function Settings() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const version = Constants.expoConfig?.version ?? '?';
  const build = Constants.expoConfig?.ios?.buildNumber ?? '';
  // 지금 폰에서 도는 코드가 빌드에 박힌 것인지 OTA 로 받은 것인지 — "고쳤다는데 그대로"를 눈으로 가른다
  const source = __DEV__
    ? '개발'
    : Updates.isEmbeddedLaunch
      ? 'embedded'
      : Updates.createdAt
        ? new Date(Updates.createdAt).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'update';

  const confirmDelete = () => {
    const run = async () => {
      setDeleting(true);
      try {
        const { error } = await supabase.rpc('delete_my_account');
        if (error) throw error;
        await supabase.auth.signOut();
        // 남은 화면·캐시를 들고 있지 않게 앱을 처음부터 다시 띄운다
        if (!__DEV__) await Updates.reloadAsync();
        else router.replace('/');
      } catch (e) {
        Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e));
      } finally {
        setDeleting(false);
      }
    };
    Alert.alert(t('settings.deleteConfirmTitle'), t('settings.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.deleteAccount'), style: 'destructive', onPress: run },
    ]);
  };

  return (
    <Screen>
      <Title>{t('settings.title')}</Title>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
        <Section>{t('settings.account')}</Section>
        <Card className="py-1">
          <Row last>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="person-outline" size={17} color="#1C1C1E" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-ink">{t('settings.anonymous')}</Text>
              <Hint className="mt-0.5">{t('settings.signInHint')}</Hint>
            </View>
          </Row>
        </Card>

        <Section>{t('settings.legal')}</Section>
        <Card className="py-1">
          <Row onPress={() => router.push({ pathname: '/privacy' })}>
            <Text className="flex-1 text-[15px] text-ink">{t('settings.privacy')}</Text>
            <Ionicons name="chevron-forward" size={17} color="#8E8E93" />
          </Row>
          <Row onPress={() => router.push({ pathname: '/terms' })} last>
            <Text className="flex-1 text-[15px] text-ink">{t('settings.terms')}</Text>
            <Ionicons name="chevron-forward" size={17} color="#8E8E93" />
          </Row>
        </Card>

        <Section>{t('settings.danger')}</Section>
        <Card className="py-1">
          <Row onPress={deleting ? undefined : confirmDelete} last>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-accent">{t('settings.deleteAccount')}</Text>
              <Hint className="mt-0.5">{t('settings.deleteWarn')}</Hint>
            </View>
          </Row>
        </Card>

        <Hint className="mb-8 mt-6 text-center">
          {`${t('settings.version')} ${version}${build ? ` (${build})` : ''} · ${source}${Platform.OS === 'web' ? ' · web' : ''}`}
        </Hint>
      </ScrollView>
    </Screen>
  );
}
