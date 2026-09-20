-- 밥비티아이 v1 스키마 — DECISIONS.md §2 가 권위. 여기서 바꾸면 거기도 같은 날짜로.
-- 원칙: meals 가 단일 진실 소스. 카운트·타입·카드는 전부 뷰/함수로 파생. 파생값 저장 금지.

create extension if not exists "pgcrypto";

-- 카탈로그. group_id null = 전역 시드, 값 = 그 모임 커스텀.
-- tags: 재료 태그(있으면 거부: spicy seafood pork beef chicken gluten dairy nuts)
--       + 양성 태그(없으면 거부: halal_ok veg_ok vegan_ok)
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text not null,
  emoji text not null default '🍽️',
  tags text[] not null default '{}',
  spice smallint not null default 0 check (spice between 0 and 3),
  description_en text,
  group_id uuid,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique,
  created_by uuid,
  created_at timestamptz not null default now()
);

alter table public.foods
  add constraint foods_group_fk foreign key (group_id) references public.groups(id) on delete cascade;

-- 모임 안의 사람. 앱 유저와 별개 엔티티 — 게스트가 여기 산다. user_id null = 아직 아무도 안 잡은 이름.
create table public.members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 20),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (group_id, display_name)
);
create index members_user_idx on public.members(user_id);
create index members_group_idx on public.members(group_id);

alter table public.groups
  add constraint groups_created_by_fk foreign key (created_by) references public.members(id) on delete set null;

-- 못먹음 = 거부권. food_id 또는 tag 둘 중 하나.
create type public.restriction_kind as enum ('allergy', 'dislike', 'belief');
create table public.restrictions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  food_id uuid references public.foods(id) on delete cascade,
  tag text,
  kind public.restriction_kind not null default 'dislike',
  check ((food_id is null) <> (tag is null))
);
create index restrictions_member_idx on public.restrictions(member_id);

-- "오늘 뭐먹지" 한 판. open(후보) → voting(투표) → done(결정)
create type public.session_status as enum ('open', 'voting', 'done');
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  started_by uuid not null references public.members(id) on delete cascade,
  status public.session_status not null default 'open',
  decided_food_id uuid references public.foods(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index sessions_group_idx on public.sessions(group_id, created_at desc);

-- 이번 판에 있는 사람. 거부권 범위 = 참여자.
create table public.session_participants (
  session_id uuid not null references public.sessions(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (session_id, member_id)
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  food_id uuid not null references public.foods(id),
  proposed_by uuid not null references public.members(id),
  vetoed_by uuid references public.members(id),   -- 거부권 발동 시 누구 때문인지 (화면: "OO이 못 먹어서 빠짐")
  created_at timestamptz not null default now(),
  unique (session_id, food_id)
);

-- 1인 최대 2표. 개수 제약은 RPC(cast_vote)에서.
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  food_id uuid not null references public.foods(id),
  created_at timestamptz not null default now(),
  unique (session_id, member_id, food_id)
);

-- ★ 기록. 단일 진실 소스. session_id null = 수동 추가("그냥 먹었어")
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  food_id uuid not null references public.foods(id),
  eaten_at timestamptz not null default now(),
  place_name text,                                 -- v2 식당 엔티티로 승격할 자리
  note text
);
create index meals_group_idx on public.meals(group_id, eaten_at desc);

create table public.meal_participants (
  meal_id uuid not null references public.meals(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  primary key (meal_id, member_id)
);
create index meal_participants_member_idx on public.meal_participants(member_id);

-- Realtime: 세션 화면이 구독하는 테이블
alter publication supabase_realtime add table public.sessions, public.session_participants, public.candidates, public.votes;
