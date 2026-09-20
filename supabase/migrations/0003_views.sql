-- 파생 통계. 전부 meals 에서. security_invoker 라 RLS 가 그대로 적용된다.

-- "OO이랑 n번째" — 두 멤버가 같이 먹은 횟수 (a < b 로 한 쌍 한 줄)
create view public.pair_meal_counts with (security_invoker = true) as
select a.member_id as member_a, b.member_id as member_b, count(*)::int as n
from public.meal_participants a
join public.meal_participants b on a.meal_id = b.meal_id and a.member_id < b.member_id
group by a.member_id, b.member_id;

-- "마라탕 n번째" — 멤버별 음식 횟수 (권위자)
create view public.member_food_counts with (security_invoker = true) as
select mp.member_id, ml.food_id, count(*)::int as n
from public.meal_participants mp
join public.meals ml on ml.id = mp.meal_id
group by mp.member_id, ml.food_id;

-- "이 모임 마라탕 n번째"
create view public.group_food_counts with (security_invoker = true) as
select ml.group_id, ml.food_id, count(*)::int as n
from public.meals ml
group by ml.group_id, ml.food_id;

-- 멤버 총 끼니 · 고유 음식 수 (도감)
create view public.member_meal_stats with (security_invoker = true) as
select mp.member_id, count(*)::int as total, count(distinct ml.food_id)::int as distinct_foods
from public.meal_participants mp
join public.meals ml on ml.id = mp.meal_id
group by mp.member_id;

-- 타입 축 1 재료: 최근 n끼의 food_id 목록 (최신순). 비율 계산은 클라이언트 src/lib/bapbti.ts
create or replace function public.member_recent_foods(p_member_id uuid, p_n int default 10)
returns setof uuid language sql stable security invoker set search_path = public as $$
  select ml.food_id
  from public.meal_participants mp
  join public.meals ml on ml.id = mp.meal_id
  where mp.member_id = p_member_id
  order by ml.eaten_at desc
  limit p_n;
$$;
