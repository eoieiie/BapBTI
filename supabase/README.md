# supabase/

`migrations/`를 번호 순서대로 SQL Editor에 붙여넣고 실행한다 (0001 → 0004). 그다음 `seed/0001_foods.sql`.

- 스키마의 권위는 `../DECISIONS.md §2`. 여기서 바꾸면 거기도.
- 거부권·투표 상한·룰렛 결과는 `0004_rpc.sql`이 권위. 클라이언트 `src/lib/decision.ts`는 표시용 복제본.
- 익명 로그인: Dashboard → Authentication → Sign In / Providers → **Anonymous sign-ins 켜기**. 안 켜면 앱이 첫 화면에서 죽는다.
- Realtime: 0001이 publication에 테이블을 넣는다. Dashboard에서 Realtime이 켜져 있는지만 확인.
- keepalive: `.github/workflows/supabase-keepalive.yml`의 URL·키를 새 프로젝트 값으로 바꾼다 (publishable 키는 공개값).
