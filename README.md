# 밥비티아이

모임이 밥을 정하면 자동으로 기록되고, 기록이 쌓여 그 사람과 모임의 밥비티아이가 된다.

결정은 룰렛이 한다. 못 먹는 건 투표 전에 빠지고, 표를 받은 후보만 룰렛에 올라간다.
결과는 카드 한 장으로 남는다.

- 웹: https://bapbti.expo.app
- iOS: TestFlight (내부)

## 구조

```
bapbti-app/   Expo(React Native) 앱. iOS·Android·웹 한 코드베이스
supabase/     스키마·RLS·RPC 마이그레이션과 시드
wireframe/    초기 와이어프레임
DECISIONS.md  기술 결정 기록. 스택·스키마·컷라인은 여기가 기준
```

## 개발

```bash
cd bapbti-app
npm install
cp .env.example .env    # Supabase URL / publishable key
npm start               # w 웹, i iOS 시뮬레이터
npm run check           # typecheck, lint, test, web export
```

DB는 `supabase/migrations`를 번호 순서대로 Supabase SQL Editor에서 실행한 뒤 `supabase/seed`를 넣는다.
익명 로그인을 켜야 첫 화면이 뜬다. 자세한 건 `supabase/README.md`.

## 배포

- 웹: `npx expo export --platform web && eas deploy --prod`
- iOS: `eas build --profile testflight --platform ios` → `eas submit --platform ios --latest`

## 규칙

- 거부권·투표·룰렛 결과·기록은 서버(`supabase/migrations/0004_rpc.sql`)가 정한다. 클라이언트는 표시만 한다.
- 커밋 메시지에 AI 서명을 넣지 않는다. `.githooks/commit-msg`가 막는다.
