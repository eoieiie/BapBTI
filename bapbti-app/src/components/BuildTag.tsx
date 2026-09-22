// 지금 폰에서 돌고 있는 코드가 무엇인지 — 버전 + OTA 업데이트 시각.
// "고쳤다는데 그대로"를 눈으로 구분하려고 둔다. 개발 중엔 "개발"로 뜬다.
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Text } from 'react-native';

export function BuildTag() {
  const version = Constants.expoConfig?.version ?? '?';
  const stamp = Updates.createdAt ? new Date(Updates.createdAt).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
  const where = __DEV__ ? '개발' : Updates.isEmbeddedLaunch ? '빌드 그대로' : (stamp ?? '업데이트');
  return <Text className="mt-6 text-center text-[11px] text-sub">{`v${version} · ${where}`}</Text>;
}
