-- 2026-09-22 병주: 못 먹는 건 모임이 아니라 사람에게 붙는 것. 프로필에서 한 번 적어두고 모든 모임에 적용.
-- 저장 위치는 그대로 members 아래(restrictions.member_id)지만, 쓰기는 "내 모든 멤버 행"에 한 번에 한다.
-- 새 모임에 들어갈 때는 기존 설정을 복사한다.

-- 내 못 먹는 것 읽기 (아무 모임이나 하나 기준 — 전부 같은 값으로 유지된다)
create or replace function public.get_my_restrictions()
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_build_object(
    'tags', coalesce((select json_agg(distinct r.tag) from public.restrictions r
                      join public.members m on m.id = r.member_id
                      where m.user_id = auth.uid() and r.tag is not null), '[]'::json),
    'food_ids', coalesce((select json_agg(distinct r.food_id) from public.restrictions r
                      join public.members m on m.id = r.member_id
                      where m.user_id = auth.uid() and r.food_id is not null), '[]'::json),
    'kind', coalesce((select r.kind::text from public.restrictions r
                      join public.members m on m.id = r.member_id
                      where m.user_id = auth.uid() limit 1), 'dislike')
  ), '{}'::json);
$$;

-- 내 모든 멤버 행에 같은 값으로 저장. 진행 중인 세션이 있으면 거부권을 다시 계산한다.
create or replace function public.set_my_restrictions(p_tags text[], p_food_ids uuid[], p_kind public.restriction_kind default 'dislike')
returns void language plpgsql security definer set search_path = public as $$
declare
  v_mid uuid;
  v_sid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  for v_mid in select id from public.members where user_id = auth.uid() loop
    delete from public.restrictions where member_id = v_mid;
    insert into public.restrictions (member_id, tag, kind) select v_mid, tg, p_kind from unnest(p_tags) tg;
    insert into public.restrictions (member_id, food_id, kind) select v_mid, f, p_kind from unnest(p_food_ids) f;
  end loop;
  -- 내가 참여 중인 진행 중 세션의 후보들 거부권 갱신
  for v_sid in
    select sp.session_id from public.session_participants sp
    join public.members m on m.id = sp.member_id
    join public.sessions s on s.id = sp.session_id
    where m.user_id = auth.uid() and s.status <> 'done'
  loop
    perform public.reevaluate_vetoes(v_sid);
  end loop;
end $$;

-- 새 모임 참여 시 기존 설정 복사
create or replace function public.join_group(p_code text, p_member_id uuid default null, p_display_name text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_gid uuid;
  v_mid uuid;
  v_src uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select id into v_gid from public.groups where invite_code = upper(p_code);
  if v_gid is null then raise exception 'no such group'; end if;

  select id into v_mid from public.members where group_id = v_gid and user_id = auth.uid();
  if v_mid is not null then return v_mid; end if;

  select id into v_src from public.members where user_id = auth.uid() limit 1;  -- 복사 원본

  if p_member_id is not null then
    update public.members set user_id = auth.uid()
    where id = p_member_id and group_id = v_gid and user_id is null
    returning id into v_mid;
    if v_mid is null then raise exception 'name already taken'; end if;
  else
    if p_display_name is null then raise exception 'name required'; end if;
    insert into public.members (group_id, display_name, user_id) values (v_gid, p_display_name, auth.uid()) returning id into v_mid;
  end if;

  if v_src is not null then
    insert into public.restrictions (member_id, food_id, tag, kind)
    select v_mid, r.food_id, r.tag, r.kind from public.restrictions r where r.member_id = v_src;
  end if;
  return v_mid;
end $$;

grant execute on function public.get_my_restrictions, public.set_my_restrictions to authenticated;
