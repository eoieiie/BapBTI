-- 2026-09-20 테스트 데이터 지우다 발견: candidates.proposed_by / vetoed_by 가 members 를 참조하는데 cascade 가 없어서
-- 모임(→멤버) 삭제가 막혔다. 0001 도 같이 고쳤고, 이미 만들어진 DB 는 이걸로.
alter table public.candidates drop constraint candidates_proposed_by_fkey,
  add constraint candidates_proposed_by_fkey foreign key (proposed_by) references public.members(id) on delete cascade;
alter table public.candidates drop constraint candidates_vetoed_by_fkey,
  add constraint candidates_vetoed_by_fkey foreign key (vetoed_by) references public.members(id) on delete set null;
