-- RPC. 전부 security definer + 안에서 멤버십 검사. 클라이언트는 이 함수들만 호출해서 상태를 바꾼다.
-- 거부권·투표 상한·룰렛은 여기가 권위. src/lib/decision.ts 는 화면 표시용 복제본 — 둘이 어긋나면 여기가 맞다.

-- 거부권: 참여자 중 이 음식을 못 먹는 사람이 있으면 그 member_id, 없으면 null
create or replace function public.compute_veto(p_session_id uuid, p_food_id uuid)
returns uuid language plpgsql stable security definer set search_path = public as $$
declare
  v_tags text[];
  v_member uuid;
begin
  select tags into v_tags from public.foods where id = p_food_id;
  select r.member_id into v_member
  from public.restrictions r
  join public.session_participants sp on sp.member_id = r.member_id and sp.session_id = p_session_id
  where (r.food_id = p_food_id)
     or (r.tag in ('spicy','seafood','pork','beef','chicken','gluten','dairy','nuts') and r.tag = any(v_tags))
     or (r.tag = 'halal'      and not ('halal_ok'  = any(v_tags)))
     or (r.tag = 'vegetarian' and not ('veg_ok'    = any(v_tags)))
     or (r.tag = 'vegan'      and not ('vegan_ok'  = any(v_tags)))
  order by sp.joined_at
  limit 1;
  return v_member;
end $$;

create or replace function public.reevaluate_vetoes(p_session_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.candidates c
  set vetoed_by = public.compute_veto(p_session_id, c.food_id)
  where c.session_id = p_session_id;
$$;

-- 초대 코드: 대문자+숫자 6자, 헷갈리는 글자(0 O 1 I) 제외
create or replace function public.gen_invite_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out text := '';
  i int;
begin
  for i in 1..6 loop
    out := out || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return out;
end $$;

-- 모임 만들기 → 만든 사람이 첫 멤버
create or replace function public.create_group(p_name text, p_display_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_gid uuid;
  v_mid uuid;
  v_code text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  loop
    v_code := public.gen_invite_code();
    exit when not exists (select 1 from public.groups where invite_code = v_code);
  end loop;
  insert into public.groups (name, invite_code) values (p_name, v_code) returning id into v_gid;
  insert into public.members (group_id, display_name, user_id) values (v_gid, p_display_name, auth.uid()) returning id into v_mid;
  update public.groups set created_by = v_mid where id = v_gid;
  return v_gid;
end $$;

-- 초대 링크 첫 화면: 멤버가 아니어도 이름 목록은 봐야 하므로 definer. 활성 세션도 같이.
create or replace function public.get_group_by_code(p_code text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', g.id,
    'name', g.name,
    'members', (select coalesce(json_agg(json_build_object('id', m.id, 'display_name', m.display_name, 'claimed', m.user_id is not null, 'mine', m.user_id = auth.uid()) order by m.created_at), '[]'::json)
                from public.members m where m.group_id = g.id),
    'active_session_id', (select s.id from public.sessions s where s.group_id = g.id and s.status <> 'done' order by s.created_at desc limit 1)
  )
  from public.groups g where g.invite_code = upper(p_code);
$$;

-- 참여: 기존 이름 잡기(p_member_id) 또는 새 이름(p_display_name). 이미 내 멤버가 있으면 그거.
create or replace function public.join_group(p_code text, p_member_id uuid default null, p_display_name text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_gid uuid;
  v_mid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select id into v_gid from public.groups where invite_code = upper(p_code);
  if v_gid is null then raise exception 'no such group'; end if;

  select id into v_mid from public.members where group_id = v_gid and user_id = auth.uid();
  if v_mid is not null then return v_mid; end if;

  if p_member_id is not null then
    update public.members set user_id = auth.uid()
    where id = p_member_id and group_id = v_gid and user_id is null
    returning id into v_mid;
    if v_mid is null then raise exception 'name already taken'; end if;
    return v_mid;
  end if;

  if p_display_name is null then raise exception 'name required'; end if;
  insert into public.members (group_id, display_name, user_id) values (v_gid, p_display_name, auth.uid()) returning id into v_mid;
  return v_mid;
end $$;

-- 오늘 뭐먹지 시작. 진행 중인 판이 있으면 그걸 돌려준다(중복 방지).
create or replace function public.start_session(p_group_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_mid uuid := public.my_member_id(p_group_id);
  v_sid uuid;
begin
  if v_mid is null then raise exception 'not a member'; end if;
  select id into v_sid from public.sessions where group_id = p_group_id and status <> 'done' order by created_at desc limit 1;
  if v_sid is not null then
    insert into public.session_participants (session_id, member_id) values (v_sid, v_mid) on conflict do nothing;
    return v_sid;
  end if;
  insert into public.sessions (group_id, started_by) values (p_group_id, v_mid) returning id into v_sid;
  insert into public.session_participants (session_id, member_id) values (v_sid, v_mid);
  return v_sid;
end $$;

create or replace function public.join_session(p_session_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_gid uuid;
  v_mid uuid;
begin
  select group_id into v_gid from public.sessions where id = p_session_id and status <> 'done';
  if v_gid is null then raise exception 'session closed'; end if;
  v_mid := public.my_member_id(v_gid);
  if v_mid is null then raise exception 'not a member'; end if;
  insert into public.session_participants (session_id, member_id) values (p_session_id, v_mid) on conflict do nothing;
  perform public.reevaluate_vetoes(p_session_id);   -- 새 참여자의 못먹음 반영
end $$;

create or replace function public.add_candidate(p_session_id uuid, p_food_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_gid uuid;
  v_mid uuid;
  v_cid uuid;
begin
  select group_id into v_gid from public.sessions where id = p_session_id and status = 'open';
  if v_gid is null then raise exception 'not open'; end if;
  v_mid := public.my_member_id(v_gid);
  if v_mid is null then raise exception 'not a member'; end if;
  insert into public.candidates (session_id, food_id, proposed_by, vetoed_by)
  values (p_session_id, p_food_id, v_mid, public.compute_veto(p_session_id, p_food_id))
  on conflict (session_id, food_id) do update set vetoed_by = excluded.vetoed_by
  returning id into v_cid;
  return v_cid;
end $$;

-- 호스트만: open → voting
create or replace function public.open_voting(p_session_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_ok boolean;
begin
  update public.sessions s set status = 'voting'
  where s.id = p_session_id and s.status = 'open'
    and s.started_by = public.my_member_id(s.group_id)
  returning true into v_ok;
  if v_ok is null then raise exception 'host only / not open'; end if;
end $$;

-- 표 토글. 1인 최대 2표. 거부권 걸린 후보엔 못 찍음.
create or replace function public.cast_vote(p_session_id uuid, p_food_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_gid uuid;
  v_mid uuid;
  v_existing uuid;
begin
  select group_id into v_gid from public.sessions where id = p_session_id and status = 'voting';
  if v_gid is null then raise exception 'not voting'; end if;
  v_mid := public.my_member_id(v_gid);
  if v_mid is null then raise exception 'not a member'; end if;
  if not exists (select 1 from public.session_participants where session_id = p_session_id and member_id = v_mid) then
    insert into public.session_participants (session_id, member_id) values (p_session_id, v_mid);
  end if;
  if exists (select 1 from public.candidates where session_id = p_session_id and food_id = p_food_id and vetoed_by is not null) then
    raise exception 'vetoed';
  end if;

  select id into v_existing from public.votes where session_id = p_session_id and member_id = v_mid and food_id = p_food_id;
  if v_existing is not null then
    delete from public.votes where id = v_existing;
    return false;
  end if;
  if (select count(*) from public.votes where session_id = p_session_id and member_id = v_mid) >= 2 then
    raise exception 'max 2 votes';
  end if;
  insert into public.votes (session_id, member_id, food_id) values (p_session_id, v_mid, p_food_id);
  return true;
end $$;

-- 룰렛. 호스트만. 결과는 여기서 정한다 — 클라이언트는 연출만.
-- 후보 = 거부권 없고 1표 이상. 아무도 안 찍었으면 거부권 없는 전부.
-- p_weighted: 표 수 비례(true) vs 균등(false). DECISIONS 미확정 큐 7번 — 정해지면 기본값 바꾼다.
create or replace function public.spin_roulette(p_session_id uuid, p_weighted boolean default false)
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

  if p_weighted then
    select sum(n) into v_total from pool;
    v_pick := 1 + floor(random() * v_total)::int;
    select food_id into v_food from (
      select food_id, sum(n) over (order by food_id) as cum from pool
    ) t where cum >= v_pick order by cum limit 1;
  else
    select food_id into v_food from pool order by random() limit 1;
  end if;

  update public.sessions set status = 'done', decided_food_id = v_food, decided_at = now() where id = p_session_id;

  -- ★ 자동 기록. 이게 이 앱의 존재 이유.
  insert into public.meals (group_id, session_id, food_id) values (v_gid, p_session_id, v_food) returning id into v_meal;
  insert into public.meal_participants (meal_id, member_id)
  select v_meal, member_id from public.session_participants where session_id = p_session_id;

  return v_food;
end $$;

-- 못먹음 통째로 교체 (멤버당 1회 설정 화면)
create or replace function public.set_restrictions(p_group_id uuid, p_tags text[], p_food_ids uuid[], p_kind public.restriction_kind default 'dislike')
returns void language plpgsql security definer set search_path = public as $$
declare v_mid uuid := public.my_member_id(p_group_id);
begin
  if v_mid is null then raise exception 'not a member'; end if;
  delete from public.restrictions where member_id = v_mid;
  insert into public.restrictions (member_id, tag, kind) select v_mid, t, p_kind from unnest(p_tags) t;
  insert into public.restrictions (member_id, food_id, kind) select v_mid, f, p_kind from unnest(p_food_ids) f;
end $$;

grant execute on function
  public.compute_veto, public.reevaluate_vetoes, public.create_group, public.get_group_by_code, public.join_group,
  public.start_session, public.join_session, public.add_candidate, public.open_voting, public.cast_vote,
  public.spin_roulette, public.set_restrictions, public.member_recent_foods, public.is_group_member, public.my_member_id
to authenticated;
