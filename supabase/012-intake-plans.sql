-- 012: intake forms and coach-built six-week plans (13 Nov 2026).
--
-- mg_intake        one row per form a player sends: 'matchup' (Pre Match-Up Questionnaire, www.macro.golf/match-up-questionnaire),
--                  'onboarding' (Client Onboarding, www.macro.golf/onboarding) and 'tpi' (TPI Pro screen results a coach
--                  pastes into the Plan Builder). Matched to a player by email (lower case), then name.
-- mg_coach_plans   six-week performance plans built in the Plan Builder (www.macro.golf/plan-builder-529481).
--
-- Players can only ADD a form (mg_intake_submit). Everything else needs the coach password (same password and the
-- same 8-tries / 15-minute lock as the coach dashboard, 003 / 010). Errors come back as {"error": ...} with HTTP 200
-- so the lock counter commits. Safe to run more than once.

create table if not exists public.mg_intake (
  id          uuid primary key default gen_random_uuid(),
  form        text not null check (form in ('matchup','onboarding','tpi')),
  email       text not null,
  name        text,
  answers     jsonb not null default '{}'::jsonb,
  source      text not null default 'web',
  created_at  timestamptz not null default now()
);
create index if not exists mg_intake_email_idx on public.mg_intake (lower(email));
alter table public.mg_intake enable row level security;

create table if not exists public.mg_coach_plans (
  id          text primary key,
  email       text,
  name        text,
  phase       int,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);
create index if not exists mg_coach_plans_email_idx on public.mg_coach_plans (lower(email));
alter table public.mg_coach_plans enable row level security;

-- Coach password check shared by the functions below. Returns null when the password is right, else the error text.
create or replace function public.mg_coach_gate(p_pass text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare k public.mg_coach%rowtype;
begin
  select * into k from public.mg_coach where id = 1;
  if k.locked_until is not null and k.locked_until > now() then return 'Too many tries. Wait 15 minutes.'; end if;
  if k.pass_hash is null or k.pass_hash <> crypt(coalesce(p_pass,''), k.pass_hash) then
    update public.mg_coach set fails = fails + 1,
      locked_until = case when fails + 1 >= 8 then now() + interval '15 minutes' else null end where id = 1;
    return 'Wrong password';
  end if;
  update public.mg_coach set fails = 0, locked_until = null where id = 1;
  return null;
end $$;
revoke all on function public.mg_coach_gate(text) from public, anon, authenticated;

-- Player sends a form. Public. Max 6 sends per email per form per hour, answers up to 100 KB.
create or replace function public.mg_intake_submit(p_form text, p_email text, p_name text, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare e text := lower(trim(coalesce(p_email,'')));
begin
  if p_form not in ('matchup','onboarding') then return jsonb_build_object('error','Unknown form'); end if;
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e) > 200 then return jsonb_build_object('error','Please enter a valid email address'); end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' or length(p_answers::text) > 100000 then return jsonb_build_object('error','Answers missing or too long'); end if;
  if (select count(*) from public.mg_intake where lower(email) = e and form = p_form and created_at > now() - interval '1 hour') >= 6 then
    return jsonb_build_object('error','Too many sends. Try again in an hour.');
  end if;
  insert into public.mg_intake(form, email, name, answers) values (p_form, e, left(trim(coalesce(p_name,'')),120), p_answers);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.mg_intake_submit(text, text, text, jsonb) from public;
grant execute on function public.mg_intake_submit(text, text, text, jsonb) to anon;

-- Coach: every intake row, newest first.
create or replace function public.mg_coach_intake(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass); rows jsonb;
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'form',form,'email',email,'name',name,'answers',answers,'source',source,'created_at',created_at)
         order by created_at desc), '[]'::jsonb) into rows from public.mg_intake;
  return jsonb_build_object('rows', rows);
end $$;
revoke all on function public.mg_coach_intake(text) from public;
grant execute on function public.mg_coach_intake(text) to anon;

-- Coach: add an intake row (TPI results pasted into the Plan Builder).
create or replace function public.mg_coach_intake_add(p_pass text, p_form text, p_email text, p_name text, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass); new_id uuid;
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  if p_form not in ('matchup','onboarding','tpi') then return jsonb_build_object('error','Unknown form'); end if;
  insert into public.mg_intake(form, email, name, answers, source)
    values (p_form, lower(trim(coalesce(p_email,''))), trim(coalesce(p_name,'')), coalesce(p_answers,'{}'::jsonb), 'coach') returning id into new_id;
  return jsonb_build_object('ok', true, 'id', new_id);
end $$;
revoke all on function public.mg_coach_intake_add(text, text, text, text, jsonb) from public;
grant execute on function public.mg_coach_intake_add(text, text, text, text, jsonb) to anon;

-- Coach: all plans (newest first).
create or replace function public.mg_coach_plans_list(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass); rows jsonb;
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  select coalesce(jsonb_agg(data || jsonb_build_object('id', id, 'updatedAt', (extract(epoch from updated_at)*1000)::bigint) order by updated_at desc), '[]'::jsonb)
    into rows from public.mg_coach_plans;
  return jsonb_build_object('rows', rows);
end $$;
revoke all on function public.mg_coach_plans_list(text) from public;
grant execute on function public.mg_coach_plans_list(text) to anon;

-- Coach: save (create or replace) one plan. Plans up to 400 KB.
create or replace function public.mg_coach_plan_save(p_pass text, p_id text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass);
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  if p_id is null or p_id !~ '^[A-Za-z0-9_-]{4,40}$' then return jsonb_build_object('error','Bad plan id'); end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or length(p_data::text) > 400000 then return jsonb_build_object('error','Plan missing or too big'); end if;
  insert into public.mg_coach_plans(id, email, name, phase, data, updated_at)
    values (p_id, lower(trim(coalesce(p_data->>'playerEmail',''))), p_data->>'playerName', nullif(p_data->>'phase','')::int, p_data, now())
  on conflict (id) do update set email = excluded.email, name = excluded.name, phase = excluded.phase, data = excluded.data, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.mg_coach_plan_save(text, text, jsonb) from public;
grant execute on function public.mg_coach_plan_save(text, text, jsonb) to anon;

-- Coach: delete one plan.
create or replace function public.mg_coach_plan_delete(p_pass text, p_id text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass);
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  delete from public.mg_coach_plans where id = p_id;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.mg_coach_plan_delete(text, text) from public;
grant execute on function public.mg_coach_plan_delete(text, text) to anon;
