// 약관 본문 한 장. 앱에서도 웹에서도 같은 글.
import { ScrollView, Text } from 'react-native';

import { Card, Header, Screen } from './ui';

export function LegalPage({ title, body }: { title: string; body: string }) {
  return (
    <Screen>
      <Header title={title} back />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Card className="mb-8">
          <Text className="text-[15px] leading-[24px] text-ink">{body}</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
