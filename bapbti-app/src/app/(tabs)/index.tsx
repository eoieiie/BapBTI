// 1 홈 — 내 모임 목록 + 모임 만들기
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';

import { TAB_BAR_SPACE } from '../../components/FloatingTabBar';
import { Button, Card, ErrorBox, Hint, Input, Loading, Screen, Title } from '../../components/ui';
import { useCreateGroup, useMyGroups } from '../../hooks/useGroups';
import { humanError, t } from '../../lib/i18n';

export default function Home() {
  const router = useRouter();
  const groups = useMyGroups();
  const create = useCreateGroup();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [me, setMe] = useState('');

  const submit = async () => {
    if (!name.trim() || !me.trim()) return;
    const id = await create.mutateAsync({ name: name.trim(), displayName: me.trim() });
    setOpen(false);
    setName('');
    router.push({ pathname: '/group/[id]', params: { id } });
  };

  return (
    <Screen>
      <Title>{t('home.title')}</Title>
      {groups.isLoading ? (
        <Loading />
      ) : groups.isError ? (
        <ErrorBox message={humanError(groups.error.message)} onRetry={() => groups.refetch()} />
      ) : (
        <FlatList
          data={groups.data}
          keyExtractor={(g) => g.group.id}
          ListEmptyComponent={<Hint className="py-8 text-center">{t('home.empty')}</Hint>}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push({ pathname: '/group/[id]', params: { id: item.group.id } })} className="active:opacity-80">
              <Card className="mb-3">
                <Text className="text-[20px] font-bold text-ink">{item.group.name}</Text>
                <Hint className="mt-1">{item.group.invite_code}</Hint>
              </Card>
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
          ListFooterComponent={<Button label={`+ ${t('home.create')}`} ghost onPress={() => setOpen(true)} />}
        />
      )}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/30">
          <View className="rounded-t-[28px] bg-bg px-5 pb-10 pt-6">
            <Text className="mb-4 text-[20px] font-bold text-ink">{t('home.createTitle')}</Text>
            <Input value={name} onChangeText={setName} placeholder={t('home.groupName')} className="mb-2" />
            <Input value={me} onChangeText={setMe} placeholder={t('home.yourName')} className="mb-4" />
            {create.isError && <Hint className="mb-2">{create.error.message}</Hint>}
            <Button label={t('home.create')} primary loading={create.isPending} onPress={submit} />
            <Button label={t('common.cancel')} ghost className="mt-1" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
