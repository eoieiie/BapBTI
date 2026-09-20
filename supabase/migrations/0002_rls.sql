-- RLS v1: "그 모임의 member면 그 모임 데이터 읽기". 쓰기는 대부분 RPC(security definer)로.
-- 세밀한 권한은 v2.

-- 헬퍼: 내가 그 모임 멤버인가 (RLS 정책 안에서 members 를 재귀 조회하지 않도록 security definer)
create or replace function public.is_group_member(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members m where m.group_id = gid and m.user_id = auth.uid());
$$;

create or replace function public.my_member_id(gid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select m.id from public.members m where m.group_id = gid and m.user_id = auth.uid() limit 1;
$$;

alter table public.foods enable row level security;
alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.restrictions enable row level security;
alter table public.sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.candidates enable row level security;
alter table public.votes enable row level security;
alter table public.meals enable row level security;
alter table public.meal_participants enable row level security;

-- foods: 전역 시드는 누구나(로그인), 모임 커스텀은 멤버만. 커스텀 추가는 멤버.
create policy foods_select on public.foods for select to authenticated
  using (group_id is null or public.is_group_member(group_id));
create policy foods_insert on public.foods for insert to authenticated
  with check (group_id is not null and public.is_group_member(group_id));

create policy groups_select on public.groups for select to authenticated
  using (public.is_group_member(id));
create policy groups_update on public.groups for update to authenticated
  using (public.is_group_member(id)) with check (public.is_group_member(id));

create policy members_select on public.members for select to authenticated
  using (public.is_group_member(group_id));
-- 내 표시 이름만 수정
create policy members_update_self on public.members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- restrictions: 같은 모임 멤버는 읽기(거부권 사유 표시), 쓰기는 본인 것만
create policy restrictions_select on public.restrictions for select to authenticated
  using (exists (select 1 from public.members m where m.id = member_id and public.is_group_member(m.group_id)));
create policy restrictions_write on public.restrictions for all to authenticated
  using (exists (select 1 from public.members m where m.id = member_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.members m where m.id = member_id and m.user_id = auth.uid()));

create policy sessions_select on public.sessions for select to authenticated
  using (public.is_group_member(group_id));
create policy participants_select on public.session_participants for select to authenticated
  using (exists (select 1 from public.sessions s where s.id = session_id and public.is_group_member(s.group_id)));
create policy candidates_select on public.candidates for select to authenticated
  using (exists (select 1 from public.sessions s where s.id = session_id and public.is_group_member(s.group_id)));
create policy votes_select on public.votes for select to authenticated
  using (exists (select 1 from public.sessions s where s.id = session_id and public.is_group_member(s.group_id)));

-- meals: 멤버 읽기. 수동 추가("그냥 먹었어")는 멤버가 직접 insert.
create policy meals_select on public.meals for select to authenticated
  using (public.is_group_member(group_id));
create policy meals_insert on public.meals for insert to authenticated
  with check (public.is_group_member(group_id));
create policy meal_participants_select on public.meal_participants for select to authenticated
  using (exists (select 1 from public.meals ml where ml.id = meal_id and public.is_group_member(ml.group_id)));
create policy meal_participants_insert on public.meal_participants for insert to authenticated
  with check (exists (select 1 from public.meals ml where ml.id = meal_id and public.is_group_member(ml.group_id)));
