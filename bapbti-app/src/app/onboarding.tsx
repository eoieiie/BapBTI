// 온보딩 — 이름 한 번, 문항 여덟 번, 네 글자. 여기서 나가면 프로필이 생긴다.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Reveal } from '../components/Reveal';
import { Bottom, Button, Hint, Input, Screen } from '../components/ui';
import { useSaveProfile, useSetHandle } from '../hooks/useProfile';
import { HandleField } from '../components/HandleField';
import { suggestHandle } from '../lib/handle';
import { t } from '../lib/i18n';
import { AXES, AXIS_LETTERS, QUESTIONS, scoreAxes, typeCode, type Answers } from '../lib/quiz';

export default function Onboarding() {
  const router = useRouter();
  const save = useSaveProfile();
  const [name, setName] = useState('');
  const [step, setStep] = useState(-1); // -1 이름, 0..7 문항, 8 결과, 9 아이디
  const setHandle = useSetHandle();
  const [handle, setHandleValue] = useState('');
  const [handleOk, setHandleOk] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});

  const axes = scoreAxes(answers);
  const code = typeCode(axes);

  const pick = (choice: 'A' | 'B') => {
    const q = QUESTIONS[step];
    setAnswers((prev) => ({ ...prev, [q.id]: choice }));
    setStep(step + 1);
  };

  // 결과를 먼저 저장하고 아이디 단계로. 여기서 나가도 프로필은 남는다.
  const toHandleStep = async () => {
    await save.mutateAsync({ displayName: name.trim(), quiz: answers, axes });
    setHandleValue(suggestHandle(name));
    setStep(QUESTIONS.length + 1);
  };

  const finish = async () => {
    if (handleOk) {
      try {
        await setHandle.mutateAsync(handle);
      } catch {
        return; // 저장 직전에 누가 채갔다 — 화면에 남아서 다시 고르게 둔다
      }
    }
    router.replace('/');
  };

  // 1) 이름
  if (step === -1) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <Text className="text-[30px] font-bold leading-[38px] text-ink">{t('onboarding.nameTitle')}</Text>
          <Hint className="mt-2">{t('onboarding.nameHint')}</Hint>
          <Input
            value={name}
            onChangeText={setName}
            placeholder={t('onboarding.namePlaceholder')}
            maxLength={20}
            returnKeyType="next"
            onSubmitEditing={() => name.trim() && setStep(0)}
            className="mt-6"
          />
        </View>
        <Bottom>
          <Button label={t('onboarding.start')} primary disabled={!name.trim()} onPress={() => setStep(0)} />
        </Bottom>
      </Screen>
    );
  }

  // 2) 문항
  if (step < QUESTIONS.length) {
    const q = QUESTIONS[step];
    return (
      <Screen>
        <View className="mt-4">
          <View className="h-1 flex-row gap-1">
            {QUESTIONS.map((x, i) => (
              <View key={x.id} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-ink' : 'bg-gray-200'}`} />
            ))}
          </View>
          <Hint className="mt-3">{`${step + 1} / ${QUESTIONS.length}`}</Hint>
        </View>

        <View className="flex-1 justify-center">
          <Text className="text-[26px] font-bold leading-[34px] text-ink">{q.situation}</Text>
          <View className="mt-8 gap-3">
            <Choice label={q.a} onPress={() => pick('A')} />
            <Choice label={q.b} onPress={() => pick('B')} />
          </View>
        </View>

        {step > 0 && (
          <Bottom>
            <Button label={t('common.back')} ghost onPress={() => setStep(step - 1)} />
          </Bottom>
        )}
      </Screen>
    );
  }

  // 4) 아이디
  if (step > QUESTIONS.length) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <Text className="text-[30px] font-bold leading-[38px] text-ink">{t('onboarding.handleTitle')}</Text>
          <View className="mt-6">
            <HandleField key={`h-${step}`} value={handle} onChange={setHandleValue} onStateChange={setHandleOk} />
          </View>
          {setHandle.isError && <Hint className="mt-2 text-accent">{t('onboarding.handleTaken')}</Hint>}
        </View>
        <Bottom>
          <Button label={t('onboarding.done')} primary disabled={!handleOk} loading={setHandle.isPending} onPress={finish} />
          <Button label={t('onboarding.skipHandle')} ghost className="mt-1" onPress={() => router.replace('/')} />
        </Bottom>
      </Screen>
    );
  }

  // 3) 결과
  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Reveal>
          <Hint>{t('onboarding.resultLabel', { name })}</Hint>
          <Text className="mt-2 text-[64px] font-bold tracking-[4px] text-ink">{code}</Text>
        </Reveal>
        <View className="mt-8 gap-2.5">
          {AXES.map((axis, i) => {
            const v = axes[axis] ?? 0;
            const letter = v >= 0 ? AXIS_LETTERS[axis].pos : AXIS_LETTERS[axis].neg;
            return (
              <Reveal key={axis} delay={200 + i * 90}>
                <View className="flex-row items-center gap-3">
                  <Text className="w-7 text-[20px] font-bold text-ink">{letter}</Text>
                  <Text className="flex-1 text-[15px] text-ink">{t(`onboarding.axis.${axis}.${v >= 0 ? 'pos' : 'neg'}`)}</Text>
                </View>
              </Reveal>
            );
          })}
        </View>
        <Hint className="mt-8">{t('onboarding.grows')}</Hint>
      </View>
      <Bottom>
        {save.isError && <Hint className="mb-2 text-center">{save.error.message}</Hint>}
        <Button label={t('onboarding.next')} primary loading={save.isPending} onPress={toHandleStep} />
      </Bottom>
    </Screen>
  );
}

function Choice({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-[72px] justify-center rounded-[23px] bg-white px-5 py-4 active:opacity-70">
      <Text className="text-[19px] font-bold text-ink">{label}</Text>
    </Pressable>
  );
}
