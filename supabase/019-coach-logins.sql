-- 019 (Joe, 14 Nov): a login per coach for Coach home, the Plan Builder and the Player dashboard.
--
-- Coaches (mg_coaches): joe = admin (everything, incl. coach logins and access levels), jack + sam = coach (everything
-- except coach logins and access levels), james = limited (only players he is lead or supporting coach on, full
-- coaching for them: data, notes, tasks, documents, their plans in the Plan Builder).
-- Lead / supporting coaches per player (mg_coach_assign): ref = the 6-digit plan code or 'email:<email>' (same key as
-- notes and tasks). One lead per player. Set by admin and coach roles.
--
-- Logging in: each coach picks their name and types their password -> mg_coach_login returns a session token
-- ('t.<hex>', 12 hours) which the pages send as p_pass to every mg_coach_* function, exactly where the shared
-- password used to go. First time: the coach chooses their own password, proving who they are with the old shared
-- team password (mg_coach_claim). The shared password no longer opens the dashboards on its own. The admin can reset a
-- coach (they choose a new password again the same way) or switch them off.
--
-- Filtering for limited coaches is done by thin wrappers: the existing functions are renamed to <name>_raw (no longer
-- callable from the browser) and new functions of the same name check access, then call or filter the _raw version.
-- !! If you ever re-run an older file (012-017) that redefines one of these, run this file again afterwards, or the
--    unfiltered version is exposed under the public name.
-- Safe to run more than once.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.mg_coaches (
  id text primary key,
  name text not null,
  role text not null default 'coach' check (role in ('admin','coach','limited')),
  pass_hash text,
  fails int not null default 0,
  locked_until timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  pass_set_at timestamptz
);
alter table public.mg_coaches enable row level security;
revoke all on public.mg_coaches from anon, authenticated;
insert into public.mg_coaches(id, name, role) values
  ('joe','Joe','admin'), ('jack','Jack','coach'), ('sam','Sam','coach'), ('james','James','limited')
on conflict (id) do nothing;

create table if not exists public.mg_coach_sessions (
  token_hash text primary key,
  coach_id text not null references public.mg_coaches(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table public.mg_coach_sessions enable row level security;
revoke all on public.mg_coach_sessions from anon, authenticated;

create table if not exists public.mg_coach_assign (
  ref text not null,
  coach_id text not null references public.mg_coaches(id) on delete cascade,
  role text not null check (role in ('lead','support')),
  set_by text,
  updated_at timestamptz not null default now(),
  primary key (ref, coach_id)
);
create unique index if not exists mg_coach_assign_one_lead on public.mg_coach_assign(ref) where role = 'lead';
alter table public.mg_coach_assign enable row level security;
revoke all on public.mg_coach_assign from anon, authenticated;

/* ---------- sessions ---------- */
create or replace function public.mg_coach_token_hash(t text) returns text language sql immutable set search_path = public, extensions as $$
  select encode(digest(coalesce(t,''), 'sha256'), 'hex') $$;
revoke all on function public.mg_coach_token_hash(text) from public, anon, authenticated;

-- the coach behind a session token (null if none / expired / switched off)
create or replace function public.mg_coach_me(p_pass text)
returns public.mg_coaches language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches;
begin
  if coalesce(p_pass,'') !~ '^t\.[0-9a-f]{40,}$' then return null; end if;
  select k.* into c from public.mg_coach_sessions s join public.mg_coaches k on k.id = s.coach_id
   where s.token_hash = public.mg_coach_token_hash(p_pass) and s.expires_at > now() and k.active;
  return c;
end $$;
revoke all on function public.mg_coach_me(text) from public, anon, authenticated;

-- every mg_coach_* function calls this first: null = OK, otherwise the error to show
create or replace function public.mg_coach_gate(p_pass text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches;
begin
  c := public.mg_coach_me(p_pass);
  if c.id is null then return 'Please log in again'; end if;
  return null;
end $$;
revoke all on function public.mg_coach_gate(text) from public, anon, authenticated;

create or replace function public.mg_coach_new_session(p_coach text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare t text := 't.' || encode(gen_random_bytes(24), 'hex');
begin
  delete from public.mg_coach_sessions where expires_at < now() - interval '1 day';
  insert into public.mg_coach_sessions(token_hash, coach_id, expires_at) values (public.mg_coach_token_hash(t), p_coach, now() + interval '12 hours');
  return t;
end $$;
revoke all on function public.mg_coach_new_session(text) from public, anon, authenticated;

create or replace function public.mg_coach_public(c public.mg_coaches) returns jsonb language sql stable as $$
  select jsonb_build_object('id', c.id, 'name', c.name, 'role', c.role) $$;
revoke all on function public.mg_coach_public(public.mg_coaches) from public, anon, authenticated;

-- Login screen: the coach names (and whether each has chosen a password yet). No secrets.
create or replace function public.mg_coach_names()
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'ready', pass_hash is not null) order by case role when 'admin' then 0 when 'coach' then 1 else 2 end, name), '[]'::jsonb)
    from public.mg_coaches where active $$;
revoke all on function public.mg_coach_names() from public;
grant execute on function public.mg_coach_names() to anon;

create or replace function public.mg_coach_login(p_coach text, p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches;
begin
  select * into c from public.mg_coaches where id = lower(trim(coalesce(p_coach,''))) and active;
  if c.id is null then return jsonb_build_object('error','Pick your name'); end if;
  if c.locked_until is not null and c.locked_until > now() then return jsonb_build_object('error','Too many tries. Wait 15 minutes.'); end if;
  if c.pass_hash is null then return jsonb_build_object('error','Choose your password first (First time here?)','first',true); end if;
  if c.pass_hash <> crypt(coalesce(p_pass,''), c.pass_hash) then
    update public.mg_coaches set fails = fails + 1, locked_until = case when fails + 1 >= 8 then now() + interval '15 minutes' else null end where id = c.id;
    return jsonb_build_object('error','Wrong password');
  end if;
  update public.mg_coaches set fails = 0, locked_until = null where id = c.id;
  return jsonb_build_object('token', public.mg_coach_new_session(c.id), 'coach', public.mg_coach_public(c));
end $$;
revoke all on function public.mg_coach_login(text, text) from public;
grant execute on function public.mg_coach_login(text, text) to anon;

-- First time (or after the admin resets you): prove it's you with the old shared team password, choose your own.
create or replace function public.mg_coach_claim(p_coach text, p_team text, p_new text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches; k public.mg_coach%rowtype;
begin
  select * into c from public.mg_coaches where id = lower(trim(coalesce(p_coach,''))) and active;
  if c.id is null then return jsonb_build_object('error','Pick your name'); end if;
  if c.pass_hash is not null then return jsonb_build_object('error','You already have a password. Log in, or ask Joe to reset it.'); end if;
  if length(coalesce(p_new,'')) < 8 then return jsonb_build_object('error','Choose a password of at least 8 characters'); end if;
  select * into k from public.mg_coach where id = 1;
  if k.locked_until is not null and k.locked_until > now() then return jsonb_build_object('error','Too many tries. Wait 15 minutes.'); end if;
  if k.pass_hash is null or k.pass_hash <> crypt(coalesce(p_team,''), k.pass_hash) then
    update public.mg_coach set fails = fails + 1, locked_until = case when fails + 1 >= 8 then now() + interval '15 minutes' else null end where id = 1;
    return jsonb_build_object('error','The team password is wrong');
  end if;
  update public.mg_coach set fails = 0, locked_until = null where id = 1;
  update public.mg_coaches set pass_hash = crypt(p_new, gen_salt('bf')), pass_set_at = now(), fails = 0, locked_until = null where id = c.id returning * into c;
  return jsonb_build_object('token', public.mg_coach_new_session(c.id), 'coach', public.mg_coach_public(c));
end $$;
revoke all on function public.mg_coach_claim(text, text, text) from public;
grant execute on function public.mg_coach_claim(text, text, text) to anon;

create or replace function public.mg_coach_whoami(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass);
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  return jsonb_build_object('coach', public.mg_coach_public(c));
end $$;
revoke all on function public.mg_coach_whoami(text) from public;
grant execute on function public.mg_coach_whoami(text) to anon;

create or replace function public.mg_coach_logout(p_pass text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  delete from public.mg_coach_sessions where token_hash = public.mg_coach_token_hash(p_pass) returning jsonb_build_object('ok', true) $$;
revoke all on function public.mg_coach_logout(text) from public;
grant execute on function public.mg_coach_logout(text) to anon;

create or replace function public.mg_coach_password(p_pass text, p_old text, p_new text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass);
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if c.pass_hash <> crypt(coalesce(p_old,''), c.pass_hash) then return jsonb_build_object('error','Your current password is wrong'); end if;
  if length(coalesce(p_new,'')) < 8 then return jsonb_build_object('error','Choose a password of at least 8 characters'); end if;
  update public.mg_coaches set pass_hash = crypt(p_new, gen_salt('bf')), pass_set_at = now() where id = c.id;
  delete from public.mg_coach_sessions where coach_id = c.id and token_hash <> public.mg_coach_token_hash(p_pass);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.mg_coach_password(text, text, text) from public;
grant execute on function public.mg_coach_password(text, text, text) to anon;

/* ---------- admin: coach logins and access levels (admin only) ---------- */
create or replace function public.mg_coach_admin_list(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass);
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if c.role <> 'admin' then return jsonb_build_object('error','Only an admin can manage coach logins'); end if;
  return jsonb_build_object('rows', (select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'role',role,'active',active,'ready',pass_hash is not null,'pass_set_at',pass_set_at) order by created_at), '[]'::jsonb) from public.mg_coaches));
end $$;
revoke all on function public.mg_coach_admin_list(text) from public;
grant execute on function public.mg_coach_admin_list(text) to anon;

-- add or change a coach; p_reset = clear their password so they choose a new one (and log them out everywhere)
create or replace function public.mg_coach_admin_save(p_pass text, p_id text, p_name text, p_role text, p_active boolean, p_reset boolean default false)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); i text := lower(regexp_replace(trim(coalesce(p_id, p_name, '')), '[^a-zA-Z0-9]+', '-', 'g'));
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if c.role <> 'admin' then return jsonb_build_object('error','Only an admin can manage coach logins'); end if;
  if i = '' then return jsonb_build_object('error','Give the coach a name'); end if;
  if coalesce(p_role,'coach') not in ('admin','coach','limited') then return jsonb_build_object('error','Unknown access level'); end if;
  if i = c.id and (coalesce(p_role,'admin') <> 'admin' or p_active is false) then return jsonb_build_object('error','You can''t remove your own admin access'); end if;
  insert into public.mg_coaches(id, name, role, active) values (i, coalesce(nullif(trim(p_name),''), i), coalesce(p_role,'coach'), coalesce(p_active,true))
  on conflict (id) do update set name = coalesce(nullif(trim(p_name),''), public.mg_coaches.name), role = coalesce(p_role, public.mg_coaches.role), active = coalesce(p_active, public.mg_coaches.active);
  if coalesce(p_reset,false) or p_active is false then
    if coalesce(p_reset,false) then update public.mg_coaches set pass_hash = null, pass_set_at = null, fails = 0, locked_until = null where id = i; end if;
    delete from public.mg_coach_sessions where coach_id = i;
  end if;
  return jsonb_build_object('ok', true, 'id', i);
end $$;
revoke all on function public.mg_coach_admin_save(text, text, text, text, boolean, boolean) from public;
grant execute on function public.mg_coach_admin_save(text, text, text, text, boolean, boolean) to anon;

/* ---------- which players a coach may see ---------- */
-- refs (plan codes and 'email:<email>') plus the emails those cover, for a limited coach
create or replace function public.mg_coach_scope(p_coach text)
returns table(code text, email text) language sql stable security definer set search_path = public as $$
  select a.ref, lower(c.email) from public.mg_coach_assign a left join public.mg_clients c on c.code = a.ref where a.coach_id = p_coach and a.ref !~ '^email:'
  union
  select null, lower(substr(a.ref, 7)) from public.mg_coach_assign a where a.coach_id = p_coach and a.ref ~ '^email:'
$$;
revoke all on function public.mg_coach_scope(text) from public, anon, authenticated;

create or replace function public.mg_coach_sees(c public.mg_coaches, p_code text, p_email text)
returns boolean language sql stable security definer set search_path = public as $$
  select c.role in ('admin','coach') or exists (
    select 1 from public.mg_coach_scope(c.id) s
     where (p_code is not null and s.code = p_code)
        or (coalesce(p_email,'') <> '' and s.email = lower(p_email))
        or (p_code ~ '^email:' and s.email = lower(substr(p_code, 7)))
        or (p_code ~ '^pure:' and s.email = lower(regexp_replace(p_code, '^pure:[^:]+:', '')))
        or (p_code ~ '^[0-9]{6}$' and s.email is not null and s.email = (select lower(email) from public.mg_clients where code = p_code))) $$;
revoke all on function public.mg_coach_sees(public.mg_coaches, text, text) from public, anon, authenticated;

/* ---------- lead and supporting coaches ---------- */
create or replace function public.mg_coach_assignments(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass);
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  return jsonb_build_object('me', public.mg_coach_public(c),
    'coaches', (select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'role',role) order by case role when 'admin' then 0 when 'coach' then 1 else 2 end, name), '[]'::jsonb) from public.mg_coaches where active),
    'rows', (select coalesce(jsonb_agg(jsonb_build_object('ref',a.ref,'coach',a.coach_id,'role',a.role)), '[]'::jsonb) from public.mg_coach_assign a
              where public.mg_coach_sees(c, a.ref, null)));
end $$;
revoke all on function public.mg_coach_assignments(text) from public;
grant execute on function public.mg_coach_assignments(text) to anon;

-- p_role: 'lead', 'support', or null to take the coach off this player. A new lead replaces the old lead (who becomes support).
create or replace function public.mg_coach_assign_set(p_pass text, p_ref text, p_coach text, p_role text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); r text := trim(coalesce(p_ref,''));
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if c.role not in ('admin','coach') then return jsonb_build_object('error','Ask Joe, Jack or Sam to change the coaches on a player'); end if;
  if r = '' or not exists (select 1 from public.mg_coaches where id = p_coach) then return jsonb_build_object('error','Unknown player or coach'); end if;
  if r ~ '^email:' then r := 'email:' || lower(substr(r, 7)); end if;
  if p_role is null then delete from public.mg_coach_assign where ref = r and coach_id = p_coach; return jsonb_build_object('ok', true); end if;
  if p_role not in ('lead','support') then return jsonb_build_object('error','Lead or supporting'); end if;
  if p_role = 'lead' then update public.mg_coach_assign set role = 'support' where ref = r and role = 'lead' and coach_id <> p_coach; end if;
  insert into public.mg_coach_assign(ref, coach_id, role, set_by) values (r, p_coach, p_role, c.id)
  on conflict (ref, coach_id) do update set role = excluded.role, set_by = excluded.set_by, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.mg_coach_assign_set(text, text, text, text) from public;
grant execute on function public.mg_coach_assign_set(text, text, text, text) to anon;

/* ---------- wrappers: rename the existing functions to *_raw once, then put checked versions in their place ---------- */
do $$
declare f text;
begin
  foreach f in array array['mg_coach_plans_list(text)','mg_coach_intake(text)','mg_coach_board_summary(text)','mg_coach_athletes(text)',
    'mg_coach_board(text, text)','mg_coach_note_save(text, jsonb)','mg_coach_task_save(text, jsonb)','mg_coach_doc_save(text, jsonb)',
    'mg_coach_board_delete(text, text, uuid)','mg_coach_plan_save(text, text, jsonb)','mg_coach_plan_publish(text, text, boolean)',
    'mg_coach_plan_delete(text, text)','mg_coach_intake_add(text, text, text, text, jsonb)',
    'mg_coach_athlete_set(text, text, text, boolean, text, text)','mg_coach_app_game_add(text, text, text, text, text, uuid)',
    'mg_coach_game_status(text, uuid, text)','mg_coach_game_suggest(text, text, text, text)']
  loop
    -- a function that is not one of our wrappers yet (no "wrapper 019" comment) gets renamed to _raw, replacing any older _raw
    if to_regprocedure('public.' || f) is not null and coalesce(obj_description(to_regprocedure('public.' || f), 'pg_proc'), '') <> 'wrapper 019' then
      if to_regprocedure('public.' || replace(f, '(', '_raw(')) is not null then execute 'drop function public.' || replace(f, '(', '_raw('); end if;
      execute 'alter function public.' || f || ' rename to ' || split_part(f, '(', 1) || '_raw';
      execute 'revoke all on function public.' || replace(f, '(', '_raw(') || ' from public, anon, authenticated';
    end if;
  end loop;
end $$;

-- people and the old all-clients list (these had their own password check, so they are rewritten whole)
create or replace function public.mg_coach_people(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); rows jsonb;
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'code', x.code, 'name', x.name, 'plan', x.plan, 'kind', x.kind, 'email', x.email, 'path', x.path,
           'includes', to_jsonb(x.includes), 'created_at', x.created_at, 'data', s.data, 'updated_at', s.updated_at)
         order by s.updated_at desc nulls last), '[]'::jsonb)
    into rows from public.mg_clients x left join public.mg_state s on s.code = x.code
   where public.mg_coach_sees(c, x.code, x.email);
  return jsonb_build_object('rows', rows, 'me', public.mg_coach_public(c));
end $$;
revoke all on function public.mg_coach_people(text) from public;
grant execute on function public.mg_coach_people(text) to anon;

drop function if exists public.mg_coach_all(text);
create function public.mg_coach_all(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); rows jsonb;
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('code',x.code,'name',x.name,'plan',x.plan,'data',s.data,'updated_at',s.updated_at) order by s.updated_at desc nulls last),'[]'::jsonb)
    into rows from public.mg_clients x left join public.mg_state s on s.code = x.code where public.mg_coach_sees(c, x.code, x.email);
  return jsonb_build_object('rows', rows);
end $$;
revoke all on function public.mg_coach_all(text) from public;
grant execute on function public.mg_coach_all(text) to anon;

-- read wrappers: full list for admin / coach, filtered for limited
create or replace function public.mg_coach_plans_list(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); r jsonb;
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  r := public.mg_coach_plans_list_raw(p_pass);
  if c.role = 'limited' and r ? 'rows' then
    r := jsonb_build_object('rows', coalesce((select jsonb_agg(e) from jsonb_array_elements(r->'rows') e
      where e->>'owner' = c.id or public.mg_coach_sees(c, nullif(e->>'appCode',''), e->>'playerEmail')), '[]'::jsonb));
  end if;
  return r;
end $$;
comment on function public.mg_coach_plans_list(text) is 'wrapper 019';

create or replace function public.mg_coach_intake(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); r jsonb;
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  r := public.mg_coach_intake_raw(p_pass);
  if c.role = 'limited' and r ? 'rows' then
    r := jsonb_build_object('rows', coalesce((select jsonb_agg(e) from jsonb_array_elements(r->'rows') e where public.mg_coach_sees(c, null, e->>'email')), '[]'::jsonb));
  end if;
  return r;
end $$;
comment on function public.mg_coach_intake(text) is 'wrapper 019';

create or replace function public.mg_coach_board_summary(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); r jsonb;
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  r := public.mg_coach_board_summary_raw(p_pass);
  if c.role = 'limited' and jsonb_typeof(r) = 'object' and not r ? 'error' then
    r := coalesce((select jsonb_object_agg(k, v) from jsonb_each(r) as t(k, v) where public.mg_coach_sees(c, k, null)), '{}'::jsonb);
  end if;
  return r;
end $$;
comment on function public.mg_coach_board_summary(text) is 'wrapper 019';

create or replace function public.mg_coach_athletes(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); r jsonb;
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  r := public.mg_coach_athletes_raw(p_pass);
  if c.role = 'limited' and r ? 'rows' then
    r := jsonb_build_object('rows', coalesce((select jsonb_agg(e) from jsonb_array_elements(r->'rows') e where public.mg_coach_sees(c, null, e->>'email')), '[]'::jsonb));
  end if;
  return r;
end $$;
comment on function public.mg_coach_athletes(text) is 'wrapper 019';

-- one player's notes, tasks, documents
create or replace function public.mg_coach_board(p_pass text, p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass);
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if not public.mg_coach_sees(c, p_code, null) then return jsonb_build_object('error','You are not a coach on this player'); end if;
  return public.mg_coach_board_raw(p_pass, p_code);
end $$;
comment on function public.mg_coach_board(text, text) is 'wrapper 019';

create or replace function public.mg_coach_note_save(p_pass text, p_note jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); cd text;
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if c.role = 'limited' then
    select code into cd from public.mg_player_notes where id = nullif(p_note->>'id','')::uuid;
    if not public.mg_coach_sees(c, coalesce(cd, p_note->>'code'), null) then return jsonb_build_object('error','You are not a coach on this player'); end if;
  end if;
  return public.mg_coach_note_save_raw(p_pass, p_note);
end $$;
comment on function public.mg_coach_note_save(text, jsonb) is 'wrapper 019';

create or replace function public.mg_coach_task_save(p_pass text, p_task jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); cd text;
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if c.role = 'limited' then
    select code into cd from public.mg_player_tasks where id = nullif(p_task->>'id','')::uuid;
    if not public.mg_coach_sees(c, coalesce(cd, p_task->>'code'), null) then return jsonb_build_object('error','You are not a coach on this player'); end if;
  end if;
  return public.mg_coach_task_save_raw(p_pass, p_task);
end $$;
comment on function public.mg_coach_task_save(text, jsonb) is 'wrapper 019';

create or replace function public.mg_coach_doc_save(p_pass text, p_doc jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); cd text;
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if c.role = 'limited' then
    select code into cd from public.mg_player_docs where id = nullif(p_doc->>'id','')::uuid;
    if not public.mg_coach_sees(c, coalesce(cd, p_doc->>'code'), null) then return jsonb_build_object('error','You are not a coach on this player'); end if;
  end if;
  return public.mg_coach_doc_save_raw(p_pass, p_doc);
end $$;
comment on function public.mg_coach_doc_save(text, jsonb) is 'wrapper 019';

create or replace function public.mg_coach_board_delete(p_pass text, p_kind text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); cd text;
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if c.role = 'limited' then
    if p_kind = 'note' then select code into cd from public.mg_player_notes where id = p_id;
    elsif p_kind = 'task' then select code into cd from public.mg_player_tasks where id = p_id;
    elsif p_kind = 'doc' then select code into cd from public.mg_player_docs where id = p_id; end if;
    if cd is null or not public.mg_coach_sees(c, cd, null) then return jsonb_build_object('error','You are not a coach on this player'); end if;
  end if;
  return public.mg_coach_board_delete_raw(p_pass, p_kind, p_id);
end $$;
comment on function public.mg_coach_board_delete(text, text, uuid) is 'wrapper 019';

-- plans: a limited coach works on plans for his players, or plans he started (data.owner)
create or replace function public.mg_coach_plan_ok(c public.mg_coaches, p_id text, p_data jsonb)
returns boolean language sql stable security definer set search_path = public as $$
  select c.role in ('admin','coach') or coalesce((
    select p.data->>'owner' = c.id or public.mg_coach_sees(c, p.code, p.email) from public.mg_coach_plans p where p.id = p_id),
    -- a new plan: allowed if it's for one of his players, or still has no email
    p_data is not null and (coalesce(p_data->>'playerEmail','') = '' or public.mg_coach_sees(c, null, p_data->>'playerEmail'))) $$;
revoke all on function public.mg_coach_plan_ok(public.mg_coaches, text, jsonb) from public, anon, authenticated;

create or replace function public.mg_coach_plan_save(p_pass text, p_id text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); d jsonb := p_data;
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if not public.mg_coach_plan_ok(c, p_id, p_data) then return jsonb_build_object('error','You are not a coach on this player'); end if;
  if c.role = 'limited' and coalesce(d->>'playerEmail','') <> '' and not public.mg_coach_sees(c, null, d->>'playerEmail') then
    return jsonb_build_object('error','That email is not one of your players. Ask Joe, Jack or Sam to add you as their coach.');
  end if;
  if d is not null and coalesce(d->>'owner','') = '' then
    d := d || jsonb_build_object('owner', coalesce((select data->>'owner' from public.mg_coach_plans where id = p_id), case when exists (select 1 from public.mg_coach_plans where id = p_id) then null else c.id end));
    if d->'owner' = 'null'::jsonb then d := d - 'owner'; end if;
  end if;
  return public.mg_coach_plan_save_raw(p_pass, p_id, d);
end $$;
comment on function public.mg_coach_plan_save(text, text, jsonb) is 'wrapper 019';

create or replace function public.mg_coach_plan_publish(p_pass text, p_id text, p_confirm boolean default false)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass); em text;
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if not public.mg_coach_plan_ok(c, p_id, null) then return jsonb_build_object('error','You are not a coach on this player'); end if;
  if c.role = 'limited' then
    select email into em from public.mg_coach_plans where id = p_id;
    if not public.mg_coach_sees(c, null, em) then return jsonb_build_object('error','That email is not one of your players. Ask Joe, Jack or Sam to add you as their coach.'); end if;
  end if;
  return public.mg_coach_plan_publish_raw(p_pass, p_id, p_confirm);
end $$;
comment on function public.mg_coach_plan_publish(text, text, boolean) is 'wrapper 019';

create or replace function public.mg_coach_plan_delete(p_pass text, p_id text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass);
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if not public.mg_coach_plan_ok(c, p_id, null) then return jsonb_build_object('error','You are not a coach on this player'); end if;
  return public.mg_coach_plan_delete_raw(p_pass, p_id);
end $$;
comment on function public.mg_coach_plan_delete(text, text) is 'wrapper 019';

create or replace function public.mg_coach_intake_add(p_pass text, p_form text, p_email text, p_name text, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass);
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if not public.mg_coach_sees(c, null, p_email) then return jsonb_build_object('error','You are not a coach on this player'); end if;
  return public.mg_coach_intake_add_raw(p_pass, p_form, p_email, p_name, p_answers);
end $$;
comment on function public.mg_coach_intake_add(text, text, text, text, jsonb) is 'wrapper 019';

create or replace function public.mg_coach_athlete_set(p_pass text, p_email text, p_name text, p_on boolean, p_source text default null, p_coach text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass);
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if not public.mg_coach_sees(c, null, p_email) then return jsonb_build_object('error','Ask Joe, Jack or Sam to add new MG Athletes'); end if;
  return public.mg_coach_athlete_set_raw(p_pass, p_email, p_name, p_on, p_source, coalesce(p_coach, c.name));
end $$;
comment on function public.mg_coach_athlete_set(text, text, text, boolean, text, text) is 'wrapper 019';

-- the games list: admin + coach; anyone can suggest a game
create or replace function public.mg_coach_app_game_add(p_pass text, p_name text, p_path text, p_area text, p_coach text default null, p_suggestion uuid default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass);
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if c.role = 'limited' then return jsonb_build_object('error','Ask Jack to add games to the app list'); end if;
  return public.mg_coach_app_game_add_raw(p_pass, p_name, p_path, p_area, coalesce(p_coach, c.name), p_suggestion);
end $$;
comment on function public.mg_coach_app_game_add(text, text, text, text, text, uuid) is 'wrapper 019';

create or replace function public.mg_coach_game_status(p_pass text, p_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass);
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  if c.role = 'limited' then return jsonb_build_object('error','Ask Jack to add games to the app list'); end if;
  return public.mg_coach_game_status_raw(p_pass, p_id, p_status);
end $$;
comment on function public.mg_coach_game_status(text, uuid, text) is 'wrapper 019';

create or replace function public.mg_coach_game_suggest(p_pass text, p_name text, p_desc text, p_coach text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_coaches := public.mg_coach_me(p_pass);
begin
  if c.id is null then return jsonb_build_object('error','Please log in again'); end if;
  return public.mg_coach_game_suggest_raw(p_pass, p_name, p_desc, coalesce(nullif(p_coach,''), c.name));
end $$;
comment on function public.mg_coach_game_suggest(text, text, text, text) is 'wrapper 019';

do $$
declare f text;
begin
  foreach f in array array['mg_coach_plans_list(text)','mg_coach_intake(text)','mg_coach_board_summary(text)','mg_coach_athletes(text)',
    'mg_coach_board(text, text)','mg_coach_note_save(text, jsonb)','mg_coach_task_save(text, jsonb)','mg_coach_doc_save(text, jsonb)',
    'mg_coach_board_delete(text, text, uuid)','mg_coach_plan_save(text, text, jsonb)','mg_coach_plan_publish(text, text, boolean)',
    'mg_coach_plan_delete(text, text)','mg_coach_intake_add(text, text, text, text, jsonb)',
    'mg_coach_athlete_set(text, text, text, boolean, text, text)','mg_coach_app_game_add(text, text, text, text, text, uuid)',
    'mg_coach_game_status(text, uuid, text)','mg_coach_game_suggest(text, text, text, text)']
  loop
    execute 'revoke all on function public.' || f || ' from public';
    execute 'grant execute on function public.' || f || ' to anon';
  end loop;
end $$;

select id, name, role, pass_hash is not null as has_password from public.mg_coaches order by created_at;
