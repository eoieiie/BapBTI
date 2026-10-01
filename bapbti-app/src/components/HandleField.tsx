// 아이디 입력 — 치는 동안 쓸 수 있는지 확인한다. 온보딩과 설정에서 같이 쓴다.
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { isHandleTaken } from '../hooks/useProfile';
import { isValidHandle, sanitizeHandle } from '../lib/handle';
import { t } from '../lib/i18n';
import { Hint, Input } from './ui';

// 서버에 물어본 결과만 상태로 들고, 형식 검사와 판정은 렌더 중에 한다.

/**
 * `value` 는 처음 한 번만 읽는다. 밖에서 값을 갈아끼워야 하면 `key` 를 바꿔 리마운트할 것.
 * (입력 중에 부모 상태를 되먹이면 한 박자 늦어서 글자가 떨어진다)
 */
export function HandleField({
  value,
  onChange,
  onStateChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onStateChange?: (ok: boolean) => void;
}) {
  const [checked, setTaken] = useState<{ handle: string; taken: boolean } | 'checking' | null>(null);
  // 입력 글자는 이 컴포넌트가 직접 들고 있는다. 부모 상태를 거치면 한 박자 늦게 반영돼서
  // 빠르게 치면 글자가 떨어져 나간다 (시뮬레이터에서 9자 중 1자만 들어갔다).
  const [text, setText] = useState(value);
  const valid = isValidHandle(text);

  useEffect(() => {
    if (!isValidHandle(text)) return;
    let cancelled = false;
    // 한 글자마다 서버를 때리지 않게 잠깐 기다린다. 기다리는 동안은 'checking' 으로 둔다.
    const mark = setTimeout(() => !cancelled && setTaken('checking'), 0);
    const timer = setTimeout(async () => {
      let result: { handle: string; taken: boolean };
      try {
        result = { handle: text, taken: await isHandleTaken(text) };
      } catch {
        result = { handle: text, taken: false }; // 확인에 실패하면 막지 않는다. 진짜 중복이면 저장할 때 걸린다
      }
      if (!cancelled) setTaken(result);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(mark);
      clearTimeout(timer);
    };
  }, [text]);

  // 결과가 지금 입력값에 대한 것일 때만 믿는다
  const settled = checked && checked !== 'checking' && checked.handle === text ? checked : null;
  const ok = valid && !!settled && !settled.taken;
  useEffect(() => onStateChange?.(ok), [ok, onStateChange]);

  const message = !text
    ? t('onboarding.handleHint')
    : !valid
      ? t('onboarding.handleInvalid')
      : !settled
        ? t('onboarding.handleChecking')
        : settled.taken
          ? t('onboarding.handleTaken')
          : t('onboarding.handleOk');
  const bad = (!!text && !valid) || (!!settled && settled.taken);

  return (
    <View>
      <Input
        value={text}
        onChangeText={(v) => {
          const clean = sanitizeHandle(v);
          setText(clean);
          onChange(clean);
        }}
        placeholder="bapbti"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={16}
      />
      <Hint className={`mt-2 ${bad ? 'text-accent' : ''}`}>{message}</Hint>
    </View>
  );
}
