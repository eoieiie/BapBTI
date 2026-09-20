-- 2026-09-19 병주: 후보에 한 줄 어필 + 내 후보 삭제. v2 "그날그날 PR"을 v1으로 당김 (첫 세션 전 마지막 추가).

alter table public.candidates add column pitch text check (char_length(pitch) <= 60);

-- add_candidate 에 pitch 선택 인자
drop function if exists public.add_candidate(uuid, uuid);
create or replace function public.add_candidate(p_session_id uuid, p_food_id uuid, p_pitch text default null)
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
  insert into public.candidates (session_id, food_id, proposed_by, vetoed_by, pitch)
  values (p_session_id, p_food_id, v_mid, public.compute_veto(p_session_id, p_food_id), nullif(trim(p_pitch), ''))
  on conflict (session_id, food_id) do update set vetoed_by = excluded.vetoed_by
  returning id into v_cid;
  return v_cid;
end $$;

-- 어필 수정: 제안자만, 결정 전까지
create or replace function public.set_pitch(p_session_id uuid, p_food_id uuid, p_pitch text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_gid uuid;
  v_ok boolean;
begin
  select group_id into v_gid from public.sessions where id = p_session_id and status <> 'done';
  if v_gid is null then raise exception 'session closed'; end if;
  update public.candidates set pitch = nullif(trim(p_pitch), '')
  where session_id = p_session_id and food_id = p_food_id and proposed_by = public.my_member_id(v_gid)
  returning true into v_ok;
  if v_ok is null then raise exception 'not your candidate'; end if;
end $$;

-- 내 후보 삭제: 제안자만, 후보 모으는 중일 때만
create or replace function public.remove_candidate(p_session_id uuid, p_food_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_gid uuid;
  v_ok boolean;
begin
  select group_id into v_gid from public.sessions where id = p_session_id and status = 'open';
  if v_gid is null then raise exception 'not open'; end if;
  delete from public.candidates
  where session_id = p_session_id and food_id = p_food_id and proposed_by = public.my_member_id(v_gid)
  returning true into v_ok;
  if v_ok is null then raise exception 'not your candidate'; end if;
end $$;

grant execute on function public.add_candidate(uuid, uuid, text), public.set_pitch, public.remove_candidate to authenticated;
