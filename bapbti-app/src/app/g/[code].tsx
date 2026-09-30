// 웹 초대 — /g/{code}. 이름 고르기 → 세션(진행 중이면) 또는 모임. 30초 규칙이 여기서 시작된다.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Bottom, Button, Chip, ErrorBox, Hint, Input, Loading, Screen } from '../../components/ui';
import { useGroupByCode, useJoinGroup } from '../../hooks/useGroups';
import { useProfile } from '../../hooks/useProfile';
import { humanError, t } from '../../lib/i18n';

export default function Invite() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const q = useGroupByCode(code);
  const join = useJoinGroup();
  const profile = useProfile();
  const savedName = profile.data?.display_name ?? '';
  const [picked, setPicked] = useState<string | null>(null);
  const [name, setName] = useState('');

  const enter = (g: NonNullable<typeof q.data>) => {
    if (g.active_session_id) router.replace({ pathname: '/session/[id]', params: { id: g.active_session_id } });
    else router.replace({ pathname: '/group/[id]', params: { id: g.id } });
  };
  const go = async () => {
    if (!q.data) return;
    try {
      await join.mutateAsync(picked ? { code: code!, memberId: picked } : { code: code!, displayName: (name.trim() || savedName) });
    } catch {
      return;
    }
    enter(q.data);
  };

  const alreadyIn = !!q.data?.members.some((m) => m.mine);
  useEffect(() => {
    if (q.data && alreadyIn) enter(q.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data?.id, alreadyIn]);

  if (q.isError) return <Screen><ErrorBox message={humanError(q.error.message)} onRetry={() => q.refetch()} /></Screen>;
  if (q.isLoading) return <Screen><Loading /></Screen>;
  if (!q.data) return <Screen><ErrorBox message={t('invite.notFound')} /></Screen>;
  if (alreadyIn) return <Screen><Loading /></Screen>;

  const free = q.data.members.filter((m) => !m.claimed);
  const canGo = !!picked || name.trim().length > 0 || savedName.length > 0;

  return (
    <Screen>
      <View className="flex-1 pt-8">
        <Text className="text-[28px] font-bold leading-[36px] text-ink">{t('invite.title', { name: q.data.name })}</Text>
        <Text className="mt-6 text-[15px] font-bold text-sub">{savedName ? t('invite.asMe', { name: savedName }) : t('invite.who')}</Text>
        {free.length > 0 && (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {free.map((m) => (
              <Chip key={m.id} label={m.display_name} on={picked === m.id} onPress={() => { setPicked(picked === m.id ? null : m.id); setName(''); }} />
            ))}
          </View>
        )}
        {free.length > 0 && <Hint className="my-4">{t('invite.orNew')}</Hint>}
        <Input
          value={name}
          onChangeText={(v) => { setName(v); setPicked(null); }}
          placeholder={t('invite.namePlaceholder')}
          className={free.length > 0 ? '' : 'mt-3'}
          returnKeyType="done"
          onSubmitEditing={() => canGo && go()}
        />
        {join.isError && <Hint className="mt-2">{join.error.message.includes('taken') ? t('invite.taken') : join.error.message}</Hint>}
      </View>
      <Bottom>
        <Button label={t('invite.join')} primary disabled={!canGo} loading={join.isPending} onPress={go} />
        <Hint className="mt-3 text-center">{t('invite.noLogin')}</Hint>
      </Bottom>
    </Screen>
  );
}
