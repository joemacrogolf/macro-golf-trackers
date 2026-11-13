-- 016: player dashboard: 1-to-1 meeting notes and an accountability tracker (Joe, 14 Nov 2026).
-- Coaches write notes and tasks in the Player dashboard (www.macro.golf/coach-home); players see the shared notes and their
-- tasks in their plan (www.macro.golf/coach-plan, Coach tab) and tick their tasks off. Keyed by the plan code (mg_clients.code).
-- Coach functions need the coach password (mg_coach_gate, 012). Player functions need plan code + PIN (mg_check).
-- Safe to run more than once. Needs 012 and 014.

create table if not exists public.mg_player_notes (
  id         uuid primary key default gen_random_uuid(),
  code       text not null,
  meet_date  date not null default current_date,
  title      text,
  body       text,
  coach      text,
  shared     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mg_player_notes_code on public.mg_player_notes(code, meet_date desc);
alter table public.mg_player_notes enable row level security;

create table if not exists public.mg_player_tasks (
  id         uuid primary key default gen_random_uuid(),
  code       text not null,
  title      text not null,
  detail     text,
  due        date,
  owner      text not null default 'player' check (owner in ('player','coach')),
  status     text not null default 'open' check (status in ('open','done')),
  done_at    timestamptz,
  done_by    text,
  coach      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mg_player_tasks_code on public.mg_player_tasks(code, status, due);
alter table public.mg_player_tasks enable row level security;

-- Coach: everything for one player (all notes, all tasks)
create or replace function public.mg_coach_board(p_pass text, p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass);
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  return jsonb_build_object(
    'notes', coalesce((select jsonb_agg(to_jsonb(n) order by n.meet_date desc, n.created_at desc) from public.mg_player_notes n where n.code = p_code), '[]'::jsonb),
    'tasks', coalesce((select jsonb_agg(to_jsonb(t) order by (t.status = 'done'), t.due nulls last, t.created_at) from public.mg_player_tasks t where t.code = p_code), '[]'::jsonb));
end $$;
revoke all on function public.mg_coach_board(text, text) from public;
grant execute on function public.mg_coach_board(text, text) to anon;

-- Coach: open tasks and the latest note date for every player (for the player list)
create or replace function public.mg_coach_board_summary(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass);
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  return coalesce((select jsonb_object_agg(code, jsonb_build_object('open', open, 'overdue', overdue, 'lastNote', last_note)) from (
    select c.code,
      (select count(*) from public.mg_player_tasks t where t.code = c.code and t.status = 'open') as open,
      (select count(*) from public.mg_player_tasks t where t.code = c.code and t.status = 'open' and t.due < current_date) as overdue,
      (select max(meet_date) from public.mg_player_notes n where n.code = c.code) as last_note
    from (select distinct code from public.mg_player_tasks union select distinct code from public.mg_player_notes) c) x), '{}'::jsonb);
end $$;
revoke all on function public.mg_coach_board_summary(text) from public;
grant execute on function public.mg_coach_board_summary(text) to anon;

-- Coach: add or edit a note. p_note = {id?, code, meet_date, title, body, coach, shared}
create or replace function public.mg_coach_note_save(p_pass text, p_note jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass); nid uuid := nullif(p_note->>'id','')::uuid; cd text := trim(coalesce(p_note->>'code',''));
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  if not exists (select 1 from public.mg_clients where code = cd) then return jsonb_build_object('error','Unknown player'); end if;
  if length(coalesce(p_note->>'body','')) > 50000 then return jsonb_build_object('error','Note too long'); end if;
  if nid is not null and exists (select 1 from public.mg_player_notes where id = nid) then
    update public.mg_player_notes set meet_date = coalesce(nullif(p_note->>'meet_date','')::date, meet_date), title = left(p_note->>'title',200),
      body = p_note->>'body', coach = left(p_note->>'coach',60), shared = coalesce((p_note->>'shared')::boolean, shared), updated_at = now()
      where id = nid and code = cd;
  else
    insert into public.mg_player_notes(code, meet_date, title, body, coach, shared)
      values (cd, coalesce(nullif(p_note->>'meet_date','')::date, current_date), left(p_note->>'title',200), p_note->>'body', left(p_note->>'coach',60), coalesce((p_note->>'shared')::boolean, true))
      returning id into nid;
  end if;
  return jsonb_build_object('ok', true, 'id', nid);
end $$;
revoke all on function public.mg_coach_note_save(text, jsonb) from public;
grant execute on function public.mg_coach_note_save(text, jsonb) to anon;

-- Coach: add or edit a task. p_task = {id?, code, title, detail, due, owner, status, coach}
create or replace function public.mg_coach_task_save(p_pass text, p_task jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass); tid uuid := nullif(p_task->>'id','')::uuid; cd text := trim(coalesce(p_task->>'code',''));
        st text := coalesce(nullif(p_task->>'status',''),'open'); ow text := coalesce(nullif(p_task->>'owner',''),'player');
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  if not exists (select 1 from public.mg_clients where code = cd) then return jsonb_build_object('error','Unknown player'); end if;
  if length(trim(coalesce(p_task->>'title',''))) < 2 then return jsonb_build_object('error','Give the task a name'); end if;
  if st not in ('open','done') or ow not in ('player','coach') then return jsonb_build_object('error','Bad status or owner'); end if;
  if tid is not null and exists (select 1 from public.mg_player_tasks where id = tid) then
    update public.mg_player_tasks set title = left(trim(p_task->>'title'),200), detail = left(p_task->>'detail',4000), due = nullif(p_task->>'due','')::date,
      owner = ow, coach = coalesce(left(p_task->>'coach',60), coach), updated_at = now(),
      done_at = case when st = 'done' and status <> 'done' then now() when st = 'open' then null else done_at end,
      done_by = case when st = 'done' and status <> 'done' then 'coach' when st = 'open' then null else done_by end,
      status = st
      where id = tid and code = cd;
  else
    insert into public.mg_player_tasks(code, title, detail, due, owner, status, coach, done_at, done_by)
      values (cd, left(trim(p_task->>'title'),200), left(p_task->>'detail',4000), nullif(p_task->>'due','')::date, ow, st, left(p_task->>'coach',60),
              case when st = 'done' then now() end, case when st = 'done' then 'coach' end)
      returning id into tid;
  end if;
  return jsonb_build_object('ok', true, 'id', tid);
end $$;
revoke all on function public.mg_coach_task_save(text, jsonb) from public;
grant execute on function public.mg_coach_task_save(text, jsonb) to anon;

-- Coach: delete one note or task (the dashboard asks the coach to confirm first)
create or replace function public.mg_coach_board_delete(p_pass text, p_kind text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass);
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  if p_kind = 'note' then delete from public.mg_player_notes where id = p_id;
  elsif p_kind = 'task' then delete from public.mg_player_tasks where id = p_id;
  else return jsonb_build_object('error','Unknown kind'); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.mg_coach_board_delete(text, text, uuid) from public;
grant execute on function public.mg_coach_board_delete(text, text, uuid) to anon;

-- Player: their shared notes and all their tasks (plan code + PIN)
create or replace function public.mg_player_board(p_code text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare e text;
begin
  e := public.mg_check(p_code, p_pin);
  if e is not null then return jsonb_build_object('error', e); end if;
  return jsonb_build_object(
    'notes', coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'meet_date',n.meet_date,'title',n.title,'body',n.body,'coach',n.coach) order by n.meet_date desc, n.created_at desc)
                       from public.mg_player_notes n where n.code = p_code and n.shared), '[]'::jsonb),
    'tasks', coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'title',t.title,'detail',t.detail,'due',t.due,'owner',t.owner,'status',t.status,'done_at',t.done_at,'coach',t.coach)
                       order by (t.status = 'done'), t.due nulls last, t.created_at) from public.mg_player_tasks t where t.code = p_code), '[]'::jsonb));
end $$;
revoke all on function public.mg_player_board(text, text) from public;
grant execute on function public.mg_player_board(text, text) to anon;

-- Player: tick one of THEIR OWN tasks done or not done
create or replace function public.mg_player_task_done(p_code text, p_pin text, p_id uuid, p_done boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare e text;
begin
  e := public.mg_check(p_code, p_pin);
  if e is not null then return jsonb_build_object('error', e); end if;
  update public.mg_player_tasks set status = case when p_done then 'done' else 'open' end,
    done_at = case when p_done then now() else null end, done_by = case when p_done then 'player' else null end, updated_at = now()
    where id = p_id and code = p_code and owner = 'player';
  if not found then return jsonb_build_object('error','That task isn''t yours to tick'); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.mg_player_task_done(text, text, uuid, boolean) from public;
grant execute on function public.mg_player_task_done(text, text, uuid, boolean) to anon;
