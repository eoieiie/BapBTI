-- 2026-09-30 프로필 — 사람 단위. 모임과 무관하게 한 번만 만든다.
-- display_name 이 여기 있으면 새 모임에 들어갈 때 이름을 다시 묻지 않아도 된다 (30초 규칙).
-- axes: 온보딩 테스트로 정해지는 네 축의 값(-1..1). 기록이 쌓이면 확신도가 올라간다.

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text unique check (handle ~ '^[a-z0-9_]{3,16}$'),
  display_name text check (char_length(display_name) between 1 and 20),
  quiz_answers jsonb,                       -- {"q1":"A", ...} 원본. 문항이 바뀌어도 다시 계산할 수 있게 남긴다
  axes jsonb,                               -- {"explore":0.5,"spice":-1,"korean":1,"lead":0}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 프로필은 신분증이다. 같은 모임 사람이 서로의 타입을 봐야 하므로 로그인한 사람은 읽을 수 있다.
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_write on public.profiles for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 음식 분류 — 한식 ↔ 외국음식 축을 기록에서 계산하려면 필요하다
alter table public.foods add column cuisine text
  check (cuisine in ('korean', 'chinese', 'japanese', 'western', 'other'));

create or replace function public.get_my_profile()
returns json language sql stable security definer set search_path = public as $$
  select case when p.user_id is null then null else
    json_build_object('handle', p.handle, 'display_name', p.display_name, 'axes', p.axes, 'quiz_answers', p.quiz_answers)
  end
  from (select * from public.profiles where user_id = auth.uid()) p;
$$;

-- 온보딩 저장. 이미 속한 모임의 표시 이름도 같이 맞춘다.
create or replace function public.save_my_profile(p_display_name text, p_quiz jsonb, p_axes jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into public.profiles (user_id, display_name, quiz_answers, axes)
  values (auth.uid(), trim(p_display_name), p_quiz, p_axes)
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        quiz_answers = coalesce(excluded.quiz_answers, public.profiles.quiz_answers),
        axes = coalesce(excluded.axes, public.profiles.axes),
        updated_at = now();

  update public.members set display_name = trim(p_display_name) where user_id = auth.uid();
end $$;

grant execute on function public.get_my_profile, public.save_my_profile to authenticated;
