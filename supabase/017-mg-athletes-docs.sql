-- 017: MG Athletes register, player documents, notes/tasks for athletes without an app plan, MG badge for every athlete
-- (Joe, 14 Nov 2026). Needs 012, 014, 016. Safe to run more than once.
--
-- * mg_athletes: every 1-to-1 coaching client (an "MG Athlete") by email, whether or not they have a 1-to-1 plan in the app yet.
--   Coaches tag / untag people in the Player dashboard (coach-713580) and the MG Athlete dashboard (coach-home).
--   NOTE: client emails are PERSONAL DATA. Never commit them to this repo (it is public through jsDelivr): add them in the
--   dashboards or run the inserts in the Supabase SQL editor only.
-- * Notes, tasks and documents are keyed by the player's plan code, or 'email:<email>' for an athlete with no plan yet;
--   the player sees both in their plan (mg_player_board).
-- * mg_player_docs: links (Google Drive etc.) kept per player; shared ones show in the player's plan.
-- * mg_leaderboard: everything from 013 (MG mark, MG Coach badge, weekly board) plus: any score saved under an email that is
--   on mg_athletes gets the MG mark. Supersedes 013, so running this one is enough.

create table if not exists public.mg_athletes (
  email      text primary key check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name       text,
  active     boolean not null default true,
  source     text,
  note       text,
  added_by   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.mg_athletes enable row level security;
revoke all on public.mg_athletes from anon, authenticated;

create table if not exists public.mg_player_docs (
  id         uuid primary key default gen_random_uuid(),
  code       text not null,
  title      text not null,
  url        text not null,
  kind       text,
  shared     boolean not null default false,
  coach      text,
  created_at timestamptz not null default now()
);
create index if not exists mg_player_docs_code on public.mg_player_docs(code, created_at desc);
alter table public.mg_player_docs enable row level security;

alter table public.mg_player_notes add column if not exists category text;
alter table public.mg_player_notes add column if not exists pinned boolean not null default false;

-- a note / task / doc key is a known plan code, or email:<an athlete's email>
create or replace function public.mg_ref_ok(p_ref text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mg_clients where code = p_ref)
      or (p_ref like 'email:%' and exists (select 1 from public.mg_athletes where email = lower(substr(p_ref, 7))));
$$;
revoke all on function public.mg_ref_ok(text) from public, anon, authenticated;

-- Coach: the MG Athletes register
create or replace function public.mg_coach_athletes(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass);
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  return jsonb_build_object('rows', coalesce((select jsonb_agg(to_jsonb(a) order by a.active desc, a.name nulls last, a.email) from public.mg_athletes a), '[]'::jsonb));
end $$;
revoke all on function public.mg_coach_athletes(text) from public;
grant execute on function public.mg_coach_athletes(text) to anon;

-- Coach: tag (p_on true) or untag (false) someone as an MG Athlete. Untagging keeps the row, marked inactive.
create or replace function public.mg_coach_athlete_set(p_pass text, p_email text, p_name text, p_on boolean, p_source text default null, p_coach text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass); e text := lower(trim(coalesce(p_email,'')));
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('error','That email doesn''t look right'); end if;
  insert into public.mg_athletes(email, name, active, source, added_by) values (e, nullif(trim(coalesce(p_name,'')),''), coalesce(p_on,true), coalesce(p_source,'coach'), p_coach)
  on conflict (email) do update set active = coalesce(p_on, true), name = coalesce(nullif(trim(coalesce(p_name,'')),''), mg_athletes.name), updated_at = now();
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.mg_coach_athlete_set(text, text, text, boolean, text, text) from public;
grant execute on function public.mg_coach_athlete_set(text, text, text, boolean, text, text) to anon;

-- Coach: everything for one player key (notes, tasks, documents)
create or replace function public.mg_coach_board(p_pass text, p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass);
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  return jsonb_build_object(
    'notes', coalesce((select jsonb_agg(to_jsonb(n) order by n.pinned desc, n.meet_date desc, n.created_at desc) from public.mg_player_notes n where n.code = p_code), '[]'::jsonb),
    'tasks', coalesce((select jsonb_agg(to_jsonb(t) order by (t.status = 'done'), t.due nulls last, t.created_at) from public.mg_player_tasks t where t.code = p_code), '[]'::jsonb),
    'docs',  coalesce((select jsonb_agg(to_jsonb(d) order by d.created_at desc) from public.mg_player_docs d where d.code = p_code), '[]'::jsonb));
end $$;

-- Coach: add or edit a note. p_note = {id?, code, meet_date, title, body, coach, shared, category, pinned}
create or replace function public.mg_coach_note_save(p_pass text, p_note jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass); nid uuid := nullif(p_note->>'id','')::uuid; cd text := trim(coalesce(p_note->>'code',''));
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  if not public.mg_ref_ok(cd) then return jsonb_build_object('error','Unknown player'); end if;
  if length(coalesce(p_note->>'body','')) > 100000 then return jsonb_build_object('error','Note too long'); end if;
  if nid is not null and exists (select 1 from public.mg_player_notes where id = nid) then
    update public.mg_player_notes set meet_date = coalesce(nullif(p_note->>'meet_date','')::date, meet_date), title = left(p_note->>'title',200),
      body = p_note->>'body', coach = left(p_note->>'coach',60), shared = coalesce((p_note->>'shared')::boolean, shared),
      category = left(p_note->>'category',40), pinned = coalesce((p_note->>'pinned')::boolean, pinned), updated_at = now()
      where id = nid and code = cd;
  else
    insert into public.mg_player_notes(code, meet_date, title, body, coach, shared, category, pinned)
      values (cd, coalesce(nullif(p_note->>'meet_date','')::date, current_date), left(p_note->>'title',200), p_note->>'body', left(p_note->>'coach',60),
              coalesce((p_note->>'shared')::boolean, true), left(p_note->>'category',40), coalesce((p_note->>'pinned')::boolean, false))
      returning id into nid;
  end if;
  return jsonb_build_object('ok', true, 'id', nid);
end $$;

-- Coach: add or edit a task (same as 016, any player key)
create or replace function public.mg_coach_task_save(p_pass text, p_task jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass); tid uuid := nullif(p_task->>'id','')::uuid; cd text := trim(coalesce(p_task->>'code',''));
        st text := coalesce(nullif(p_task->>'status',''),'open'); ow text := coalesce(nullif(p_task->>'owner',''),'player');
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  if not public.mg_ref_ok(cd) then return jsonb_build_object('error','Unknown player'); end if;
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

-- Coach: add or edit a document link. p_doc = {id?, code, title, url, kind, shared, coach}
create or replace function public.mg_coach_doc_save(p_pass text, p_doc jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass); did uuid := nullif(p_doc->>'id','')::uuid; cd text := trim(coalesce(p_doc->>'code',''));
        u text := trim(coalesce(p_doc->>'url',''));
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  if not public.mg_ref_ok(cd) then return jsonb_build_object('error','Unknown player'); end if;
  if u !~* '^https?://' then return jsonb_build_object('error','Paste the full link, starting https://'); end if;
  if length(trim(coalesce(p_doc->>'title',''))) < 1 then return jsonb_build_object('error','Give the document a name'); end if;
  if did is not null and exists (select 1 from public.mg_player_docs where id = did) then
    update public.mg_player_docs set title = left(trim(p_doc->>'title'),200), url = left(u,2000), kind = left(p_doc->>'kind',40),
      shared = coalesce((p_doc->>'shared')::boolean, shared) where id = did and code = cd;
  else
    insert into public.mg_player_docs(code, title, url, kind, shared, coach)
      values (cd, left(trim(p_doc->>'title'),200), left(u,2000), left(p_doc->>'kind',40), coalesce((p_doc->>'shared')::boolean, false), left(p_doc->>'coach',60))
      returning id into did;
  end if;
  return jsonb_build_object('ok', true, 'id', did);
end $$;
revoke all on function public.mg_coach_doc_save(text, jsonb) from public;
grant execute on function public.mg_coach_doc_save(text, jsonb) to anon;

-- Coach: delete one note, task or document (the dashboard asks the coach to confirm first)
create or replace function public.mg_coach_board_delete(p_pass text, p_kind text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass);
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  if p_kind = 'note' then delete from public.mg_player_notes where id = p_id;
  elsif p_kind = 'task' then delete from public.mg_player_tasks where id = p_id;
  elsif p_kind = 'doc' then delete from public.mg_player_docs where id = p_id;
  else return jsonb_build_object('error','Unknown kind'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- Player: shared notes, tasks and shared documents, from their plan code and from email:<their email>
create or replace function public.mg_player_board(p_code text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare e text; em text; keys text[];
begin
  e := public.mg_check(p_code, p_pin);
  if e is not null then return jsonb_build_object('error', e); end if;
  select lower(email) into em from public.mg_clients where code = p_code;
  keys := array[p_code] || case when em is not null then array['email:' || em] else array[]::text[] end;
  return jsonb_build_object(
    'notes', coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'meet_date',n.meet_date,'title',n.title,'body',n.body,'coach',n.coach,'category',n.category) order by n.pinned desc, n.meet_date desc, n.created_at desc)
                       from public.mg_player_notes n where n.code = any(keys) and n.shared), '[]'::jsonb),
    'tasks', coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'title',t.title,'detail',t.detail,'due',t.due,'owner',t.owner,'status',t.status,'done_at',t.done_at,'coach',t.coach)
                       order by (t.status = 'done'), t.due nulls last, t.created_at) from public.mg_player_tasks t where t.code = any(keys)), '[]'::jsonb),
    'docs',  coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'title',d.title,'url',d.url,'kind',d.kind) order by d.created_at desc)
                       from public.mg_player_docs d where d.code = any(keys) and d.shared), '[]'::jsonb));
end $$;

-- Player: tick one of THEIR OWN tasks (plan code or their email key)
create or replace function public.mg_player_task_done(p_code text, p_pin text, p_id uuid, p_done boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare e text; em text;
begin
  e := public.mg_check(p_code, p_pin);
  if e is not null then return jsonb_build_object('error', e); end if;
  select lower(email) into em from public.mg_clients where code = p_code;
  update public.mg_player_tasks set status = case when p_done then 'done' else 'open' end,
    done_at = case when p_done then now() else null end, done_by = case when p_done then 'player' else null end, updated_at = now()
    where id = p_id and owner = 'player' and (code = p_code or (em is not null and code = 'email:' || em));
  if not found then return jsonb_build_object('error','That task isn''t yours to tick'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- Leaderboard: 013 + MG Athletes register
create table if not exists public.mg_lb_mg (name text primary key, added timestamptz not null default now());
alter table public.mg_lb_mg enable row level security;
revoke all on public.mg_lb_mg from anon, authenticated;
insert into public.mg_lb_mg(name) values ('Ryan Harmer') on conflict do nothing;
create table if not exists public.mg_lb_coach (email text primary key, added timestamptz not null default now());
alter table public.mg_lb_coach enable row level security;
revoke all on public.mg_lb_coach from anon, authenticated;
insert into public.mg_lb_coach(email) values ('jack@macro.golf'), ('joe@macro.golf'), ('sam@macro.golf'), ('james@macro.golf') on conflict do nothing;

create or replace function public.mg_leaderboard(p_game text, p_period text default 'all', p_me text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare m_start date := case when p_period = 'week' then date_trunc('week', now() at time zone 'Europe/London')::date
                              else date_trunc('month', now() at time zone 'Europe/London')::date end;
        res jsonb; v_better text; v_unit text;
begin
  if p_game is null or p_game !~ '^golf-[a-z0-9-]{2,40}$' or p_game = 'golf-paul-goddard' then
    return jsonb_build_object('error','Unknown game');
  end if;
  if p_period not in ('all','month','week') then p_period := 'all'; end if;

  with g as (
    select c.code,
           coalesce(nullif(trim(c.name),''), nullif(trim(s.data->'_mgSummary'->>'player'),'')) as nm,
           s.data->'_mgSummary'->'golf' as gs,
           ( c.code !~ '^pure:'
             or exists (select 1 from public.mg_clients m
                         where m.email is not null and m.code !~ '^pure:'
                           and (m.kind = 'golf' or m.pin_hash is not null)
                           and lower(m.email) = lower(regexp_replace(c.code, '^pure:[^:]+:', '')))
             or exists (select 1 from public.mg_athletes a
                         where a.active and a.email = lower(regexp_replace(c.code, '^pure:[^:]+:', '')))
             or exists (select 1 from public.mg_lb_mg x
                         where lower(regexp_replace(trim(x.name), '\s+', ' ', 'g')) =
                               lower(regexp_replace(trim(coalesce(nullif(trim(c.name),''), s.data->'_mgSummary'->>'player', '')), '\s+', ' ', 'g')))
           ) as mg,
           ( lower(c.code) ~ '^pure:[^:]+:[^@]+@macro\.golf$'
             or exists (select 1 from public.mg_lb_coach k
                         where lower(k.email) = lower(regexp_replace(c.code, '^pure:[^:]+:', ''))) ) as coach
    from public.mg_state s join public.mg_clients c on c.code = s.code
    where s.data->'_mgSummary'->'golf'->>'game' = p_game
      and coalesce((s.data->'_mgSummary'->>'lbHide')::boolean, false) = false
  ),
  r as (
    select code, nm, mg, coach, gs->>'better' as better, gs->>'unit' as unit,
           (gs->>'best')::numeric as sc, left(gs->>'bestAt',10) as d
      from g where p_period = 'all' and (gs->>'best') ~ '^-?[0-9]+(\.[0-9]+)?$'
    union all
    select code, nm, mg, coach, gs->>'better', gs->>'unit', (x->>'s')::numeric, left(x->>'d',10)
      from g, jsonb_array_elements(case when jsonb_typeof(gs->'rounds')='array' then gs->'rounds' else '[]'::jsonb end) x
      where p_period in ('month','week') and (x->>'s') ~ '^-?[0-9]+(\.[0-9]+)?$'
        and (x->>'d') ~ '^\d{4}-\d{2}-\d{2}' and left(x->>'d',10)::date >= m_start
  ),
  b as (
    select distinct on (code) code, nm, mg, coach, better, unit, sc, d from r
    order by code,
             case when better = 'low' then sc end asc nulls last,
             case when better <> 'low' then sc end desc nulls last,
             d asc
  )
  select max(better), max(unit),
         coalesce(jsonb_agg(jsonb_build_object(
           'n', case when nm is null then 'Golfer'
                     when position(' ' in nm) = 0 then initcap(nm)
                     else initcap(split_part(nm,' ',1)) || ' ' || upper(left(regexp_replace(nm,'^.*\s',''),1)) || '.' end,
           's', sc, 'd', d, 'me', (p_me is not null and code = p_me), 'mg', coalesce(mg, false), 'coach', coalesce(coach, false))
           order by case when better = 'low' then sc end asc nulls last,
                    case when better <> 'low' then sc end desc nulls last, d asc), '[]'::jsonb)
    into v_better, v_unit, res
  from (select * from b
        order by case when better = 'low' then sc end asc nulls last,
                 case when better <> 'low' then sc end desc nulls last, d asc
        limit 50) t;

  return jsonb_build_object('game', p_game, 'period', p_period, 'better', coalesce(v_better,'high'), 'unit', v_unit, 'rows', res);
end $$;

revoke all on function public.mg_leaderboard(text, text, text) from public;
grant execute on function public.mg_leaderboard(text, text, text) to anon;
