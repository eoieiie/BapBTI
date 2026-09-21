// 2 모임 — 멤버, 오늘 뭐먹지, 최근 기록. 모임 이름·내 이름은 여기서 인라인 수정.
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Avatar, Bottom, Button, Card, ErrorBox, FoodDisc, Header, Hint, Loading, NO_OUTLINE, Row, Screen, Section } from '../../../components/ui';
import { useGroup, useRenameGroup, useRenameMe, useStartSession } from '../../../hooks/useGroups';
import { foodName, t } from '../../../lib/i18n';
import { inviteUrl } from '../../../lib/links';

export default function Group() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useGroup(id);
  const start = useStartSession();
  const renameGroup = useRenameGroup();
  const renameMe = useRenameMe();
  const [editing, setEditing] = useState<'group' | 'me' | null>(null);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

  if (q.isPending) return <Screen><Loading /></Screen>;
  if (q.isError) return <Screen><ErrorBox message={q.error.message} onRetry={() => q.refetch()} /></Screen>;
  const { group, members, me, recent, activeSessionId } = q.data;

  const copy = async () => {
    await Clipboard.setStringAsync(inviteUrl(group.invite_code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const commit = async () => {
    const v = draft.trim();
    if (v) {
      if (editing === 'group') await renameGroup.mutateAsync({ id: group.id, name: v });
      if (editing === 'me' && me) await renameMe.mutateAsync({ memberId: me.id, groupId: group.id, name: v });
    }
    setEditing(null);
  };
  const onStart = async () => {
    const sid = activeSessionId ?? (await start.mutateAsync(group.id));
    router.push({ pathname: '/session/[id]', params: { id: sid } });
  };

  return (
    <Screen>
      <Header
        title={group.name}
        back
        right={
          <Pressable accessibilityRole="button" accessibilityLabel={t('group.rename')} onPress={() => { setDraft(group.name); setEditing('group'); }} className="h-10 w-10 items-center justify-center active:opacity-60">
            <Ionicons name="pencil" size={18} color="#8E8E93" />
          </Pressable>
        }
      />
      {editing === 'group' && (
        <TextInput autoFocus value={draft} onChangeText={setDraft} onBlur={commit} onSubmitEditing={commit} maxLength={40} style={NO_OUTLINE}
          className="mb-3 h-12 rounded-2xl bg-white px-4 text-[16px] text-ink" />
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* 초대 — 잘 보이게, 카드 하나 */}
        <Card className="py-4">
          <Pressable onPress={copy} className="flex-row items-center gap-3.5 active:opacity-70">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="link" size={20} color="#1C1C1E" />
            </View>
            <View className="flex-1">
              <Text className="text-[16px] font-bold text-ink">{copied ? t('group.copied') : t('group.copyLink')}</Text>
              <Hint className="mt-0.5">{group.invite_code} · {t('group.members', { n: members.length })}</Hint>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
          </Pressable>
        </Card>

        <View className="mt-4 flex-row flex-wrap gap-1">
          {members.map((m) => (
            <Pressable key={m.id} disabled={!me || m.id !== me.id} onPress={() => { setDraft(m.display_name); setEditing('me'); }}>
              <Avatar name={m.display_name} dim={!m.user_id} />
            </Pressable>
          ))}
        </View>
        {editing === 'me' && (
          <TextInput autoFocus value={draft} onChangeText={setDraft} onBlur={commit} onSubmitEditing={commit} maxLength={20} style={NO_OUTLINE}
            placeholder={t('group.yourName')} placeholderTextColor="#8E8E93" className="mt-2 h-12 rounded-2xl bg-white px-4 text-[16px] text-ink" />
        )}

        <Section>{t('group.recent')}</Section>
        <Card className="py-1">
          {recent.length === 0 && <Hint className="py-3">–</Hint>}
          {recent.map((ml, i) => (
            <Row key={ml.id} last={i === recent.length - 1}>
              <FoodDisc foodId={ml.food_id} size={40} />
              <View className="flex-1">
                <Text className="text-[16px] font-bold text-ink" numberOfLines={1}>{foodName(ml.foods)}</Text>
                <Hint className="mt-0.5">{new Date(ml.eaten_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} · {t('common.people', { n: ml.meal_participants.length })}</Hint>
              </View>
            </Row>
          ))}
        </Card>

        <Card className="mt-3 py-1">
          <Row onPress={() => router.push({ pathname: '/group/[id]/restrictions', params: { id: group.id } })} last>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="ban-outline" size={18} color="#1C1C1E" />
            </View>
            <Text className="flex-1 text-[16px] text-ink">{t('group.restrictions')}</Text>
            <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
          </Row>
        </Card>
        <View className="h-4" />
      </ScrollView>

      <Bottom>
        <Button label={activeSessionId ? `${t('group.start')} →` : t('group.start')} primary loading={start.isPending} onPress={onStart} />
      </Bottom>
    </Screen>
  );
}
