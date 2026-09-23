-- 2026-09-23 출시 기본기: 계정 삭제. 앱스토어는 계정을 만들 수 있는 앱에 삭제 수단을 요구한다.
-- 익명 계정도 계정이다. 내 멤버 행을 지우면 restrictions·candidates·votes·meal_participants 가 cascade 로 따라 지워지고,
-- 마지막으로 auth 유저 자체를 지운다. 모임에 남은 다른 사람의 기록은 건드리지 않는다.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not signed in'; end if;

  -- 내가 혼자인 모임은 통째로 정리 (남는 사람이 없으면 의미 없는 데이터다)
  delete from public.groups g
  where exists (select 1 from public.members m where m.group_id = g.id and m.user_id = v_uid)
    and not exists (select 1 from public.members m2 where m2.group_id = g.id and (m2.user_id is null or m2.user_id <> v_uid));

  -- 남은 모임에서는 내 멤버 행만 지운다 (cascade 로 내 기록·후보·표가 같이 사라진다)
  delete from public.members where user_id = v_uid;

  delete from auth.users where id = v_uid;
end $$;

grant execute on function public.delete_my_account to authenticated;
