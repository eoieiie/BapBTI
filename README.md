# BapBTI (밥비티아이)

모임이 밥을 정하면 자동으로 기록되고, 기록이 쌓여 그 사람과 모임의 '밥비티아이'가 된다.

```
DECISIONS.md      기술·제품 결정의 권위 소스. 여기부터 읽을 것
bapbti-app/       Expo(React Native) 앱 — iOS·Android·웹(초대 링크) 한 코드베이스
supabase/         마이그레이션(0001→0004) + 시드. supabase/README.md 순서대로
wireframe/        저충실도 와이어프레임 원본 (.dc.html + canvas.json)
.github/          CI(품질 게이트) + Supabase keepalive
```

사업·검증 판단은 볼트 `wiki/sources/밥비티아이/HANDOFF.md`.

## 시작하기

```bash
cd bapbti-app
npm install
cp .env.example .env          # Supabase URL / publishable 키
npm start                      # w = 웹, i = iOS 시뮬레이터(Expo Go), 폰은 Expo Go 앱으로 QR
npm run check                  # typecheck + lint + test + web export (CI 와 동일)
```

Supabase 쪽 준비는 `supabase/README.md`. 익명 로그인을 켜야 첫 화면이 뜬다.

## 규칙
- 커밋에 AI 서명 금지 (`.githooks/commit-msg` 가 거부). `git config core.hooksPath .githooks` 1회.
- 결정 메커니즘(거부권·투표·룰렛)의 권위는 `supabase/migrations/0004_rpc.sql`. 클라이언트 `src/lib/decision.ts` 는 표시용.
