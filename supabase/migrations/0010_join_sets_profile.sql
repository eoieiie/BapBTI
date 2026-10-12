-- 2026-10-07 MVP 검사에서 발견: 초대 링크로 참여한 손님이 세션에 도착하는 순간 온보딩으로 끌려갔다.
-- join_group 이 members 에만 이름을 쓰고 profiles 는 비워둬서, 온보딩 게이트가 "프로필 없음"으로 봤다.
-- 링크 → 참여 → (투표·룰렛) → 프로필 순서를 지키려면, 참여할 때 이름만 담긴 프로필을 같이 만든다.
-- 테스트(네 글자)는 비어 있고, 나중에 프로필 탭에서 한다.

create or replace function public.join_group(p_code text, p_member_id uuid default null, p_display_name text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_gid uuid;
  v_mid uuid;
  v_src uuid;
  v_name text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select id into v_gid from public.groups where invite_code = upper(p_code);
  if v_gid is null then raise exception 'no such group'; end if;

  select id into v_mid from public.members where group_id = v_gid and user_id = auth.uid();
  if v_mid is not null then return v_mid; end if;

  select id into v_src from public.members where user_id = auth.uid() limit 1;  -- 못 먹는 것 복사 원본

  if p_member_id is not null then
    update public.members set user_id = auth.uid()
    where id = p_member_id and group_id = v_gid and user_id is null
    returning id, display_name into v_mid, v_name;
    if v_mid is null then raise exception 'name already taken'; end if;
  else
    if p_display_name is null or trim(p_display_name) = '' then raise exception 'name required'; end if;
    insert into public.members (group_id, display_name, user_id) values (v_gid, trim(p_display_name), auth.uid())
    returning id, display_name into v_mid, v_name;
  end if;

  if v_src is not null then
    insert into public.restrictions (member_id, food_id, tag, kind)
    select v_mid, r.food_id, r.tag, r.kind from public.restrictions r where r.member_id = v_src;
  end if;

  -- 프로필이 없으면 이름만 담아 만든다. 이미 있으면 건드리지 않는다.
  insert into public.profiles (user_id, display_name) values (auth.uid(), v_name)
  on conflict (user_id) do nothing;

  return v_mid;
end $$;

-- 모임 만들기도 같은 원칙: 프로필 이름을 쓰고, 없으면 그때 만든다.
create or replace function public.create_group(p_name text, p_display_name text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_gid uuid;
  v_mid uuid;
  v_code text;
  v_name text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select coalesce(nullif(trim(p_display_name), ''), p.display_name) into v_name
  from (select 1) x left join public.profiles p on p.user_id = auth.uid();
  if v_name is null then raise exception 'name required'; end if;

  loop
    v_code := public.gen_invite_code();
    exit when not exists (select 1 from public.groups where invite_code = v_code);
  end loop;
  insert into public.groups (name, invite_code) values (p_name, v_code) returning id into v_gid;
  insert into public.members (group_id, display_name, user_id) values (v_gid, v_name, auth.uid()) returning id into v_mid;
  update public.groups set created_by = v_mid where id = v_gid;

  -- 내 못 먹는 것을 새 모임에도 적용
  insert into public.restrictions (member_id, food_id, tag, kind)
  select v_mid, r.food_id, r.tag, r.kind from public.restrictions r
  where r.member_id = (select id from public.members where user_id = auth.uid() and id <> v_mid limit 1);

  insert into public.profiles (user_id, display_name) values (auth.uid(), v_name)
  on conflict (user_id) do nothing;

  return v_gid;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 투표 익명을 DB 에서 지킨다.
-- 화면에는 "누가 뭘 찍었는지는 아무도 못 봐"라고 써 놓고, 실제로는 같은 모임 멤버가 votes 를 직접 읽으면
-- 누가 무엇을 찍었는지 다 보였다(2026-10-07 MVP 검사). 화면이 아니라 데이터가 약속을 지켜야 한다.
--
--  - votes 는 내 표만 읽을 수 있다
--  - "누가 투표를 마쳤는지"(무엇을 찍었는지가 아니라)는 session_participants.voted 로 공개한다 → 실시간 진행률
--  - 결과가 나온 뒤 룰렛에 그릴 후보(1표 이상 받은 음식)는 RPC 로만 준다. 누가 찍었는지는 끝까지 안 준다
--    (결과 뒤에 "B가 마라탕 찍었네"가 보이면 책임 흡수가 무너진다)

drop policy if exists votes_select on public.votes;
create policy votes_select_own on public.votes for select to authenticated
  using (exists (select 1 from public.members m where m.id = member_id and m.user_id = auth.uid()));

alter table public.session_participants add column if not exists voted boolean not null default false;

create or replace function public.cast_vote(p_session_id uuid, p_food_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_gid uuid;
  v_mid uuid;
  v_existing uuid;
  v_result boolean;
begin
  select group_id into v_gid from public.sessions where id = p_session_id and status = 'voting';
  if v_gid is null then raise exception 'not voting'; end if;
  v_mid := public.my_member_id(v_gid);
  if v_mid is null then raise exception 'not a member'; end if;
  insert into public.session_participants (session_id, member_id) values (p_session_id, v_mid) on conflict do nothing;
  if exists (select 1 from public.candidates where session_id = p_session_id and food_id = p_food_id and vetoed_by is not null) then
    raise exception 'vetoed';
  end if;

  select id into v_existing from public.votes where session_id = p_session_id and member_id = v_mid and food_id = p_food_id;
  if v_existing is not null then
    delete from public.votes where id = v_existing;
    v_result := false;
  else
    if (select count(*) from public.votes where session_id = p_session_id and member_id = v_mid) >= 2 then
      raise exception 'max 2 votes';
    end if;
    insert into public.votes (session_id, member_id, food_id) values (p_session_id, v_mid, p_food_id);
    v_result := true;
  end if;

  update public.session_participants
  set voted = exists (select 1 from public.votes where session_id = p_session_id and member_id = v_mid)
  where session_id = p_session_id and member_id = v_mid;

  return v_result;
end $$;

-- 결과가 나온 판에서만, 음식별 표 수. 누가 찍었는지는 없다. 룰렛 조각 크기에 쓴다.
drop function if exists public.session_voted_foods(uuid);
create function public.session_voted_foods(p_session_id uuid)
returns table (food_id uuid, n int) language sql stable security definer set search_path = public as $$
  select v.food_id, count(*)::int
  from public.votes v
  join public.sessions s on s.id = v.session_id
  where v.session_id = p_session_id
    and s.status = 'done'
    and public.is_group_member(s.group_id)
  group by v.food_id;
$$;

-- 룰렛 가중치 확정: 표 수 비례 (DECISIONS 2026-10-12). 본문은 0004 그대로, 기본값만 true.
create or replace function public.spin_roulette(p_session_id uuid, p_weighted boolean default true)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_gid uuid;
  v_host uuid;
  v_food uuid;
  v_meal uuid;
  v_total int;
  v_pick int;
begin
  select group_id, started_by into v_gid, v_host from public.sessions where id = p_session_id and status = 'voting';
  if v_gid is null then raise exception 'not voting'; end if;
  if v_host <> public.my_member_id(v_gid) then raise exception 'host only'; end if;

  create temp table pool on commit drop as
  select c.food_id, greatest(count(v.id), 0)::int as n
  from public.candidates c
  left join public.votes v on v.session_id = c.session_id and v.food_id = c.food_id
  where c.session_id = p_session_id and c.vetoed_by is null
  group by c.food_id;

  if (select coalesce(sum(n), 0) from pool) > 0 then
    delete from pool where n = 0;
  end if;
  if not exists (select 1 from pool) then raise exception 'no candidates'; end if;

  -- 아무도 안 찍었으면 n이 전부 0이라 비례가 안 된다 → 균등
  if p_weighted and (select sum(n) from pool) > 0 then
    select sum(n) into v_total from pool;
    v_pick := 1 + floor(random() * v_total)::int;
    select food_id into v_food from (
      select food_id, sum(n) over (order by food_id) as cum from pool
    ) t where cum >= v_pick order by cum limit 1;
  else
    select food_id into v_food from pool order by random() limit 1;
  end if;

  update public.sessions set status = 'done', decided_food_id = v_food, decided_at = now() where id = p_session_id;

  insert into public.meals (group_id, session_id, food_id) values (v_gid, p_session_id, v_food) returning id into v_meal;
  insert into public.meal_participants (meal_id, member_id)
  select v_meal, member_id from public.session_participants where session_id = p_session_id;

  return v_food;
end $$;

grant execute on function public.session_voted_foods, public.cast_vote(uuid, uuid), public.spin_roulette to authenticated;
