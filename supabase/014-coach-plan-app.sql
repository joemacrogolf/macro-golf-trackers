-- 014: coach-built plans go into the app (13 Nov 2026), plus new-game suggestions for Jack.
--
-- "Create app plan" in the Plan Builder calls mg_coach_plan_publish: it gives the player a 6-digit plan code (a new
-- mg_clients row with path 'coach-plan', or the code they already have), so My Plan opens www.macro.golf/coach-plan.
-- That one page (pages/coach-plan.html) loads the player's latest published plan with mg_plan_content (plan code + PIN,
-- same lock as every plan) and runs the 1-to-1 plan engine on it. No Kajabi page or code change per client.
-- Game suggestions: a coach types a game that isn't in the app; it lands in mg_game_suggestions for Jack.
-- Safe to run more than once. Needs 012.

alter table public.mg_coach_plans add column if not exists code text;
alter table public.mg_coach_plans add column if not exists published_at timestamptz;
create index if not exists mg_coach_plans_code_idx on public.mg_coach_plans (code);

create table if not exists public.mg_game_suggestions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  coach       text,
  status      text not null default 'new' check (status in ('new','added','declined')),
  created_at  timestamptz not null default now()
);
alter table public.mg_game_suggestions enable row level security;

-- Coach: all plans, now with the plan code and when it was last put in the app.
create or replace function public.mg_coach_plans_list(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass); rows jsonb;
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  select coalesce(jsonb_agg(data || jsonb_build_object('id', id, 'updatedAt', (extract(epoch from updated_at)*1000)::bigint,
           'appCode', code, 'publishedAt', case when published_at is null then null else (extract(epoch from published_at)*1000)::bigint end)
         order by updated_at desc), '[]'::jsonb)
    into rows from public.mg_coach_plans;
  return jsonb_build_object('rows', rows);
end $$;
revoke all on function public.mg_coach_plans_list(text) from public;
grant execute on function public.mg_coach_plans_list(text) to anon;

-- Coach: put a saved plan into the player's app. Returns {ok, code, created} or {confirm, code, path} when the
-- player's email already has a different 1-to-1 plan (call again with p_confirm = true to replace it).
create or replace function public.mg_coach_plan_publish(p_pass text, p_id text, p_confirm boolean default false)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass); p public.mg_coach_plans%rowtype; v text; cpath text; made boolean := false; em text;
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  select * into p from public.mg_coach_plans where id = p_id;
  if not found then return jsonb_build_object('error','Save the plan first'); end if;
  em := lower(trim(coalesce(p.email,'')));
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('error','Add the player''s email first'); end if;
  v := p.code;
  if v is null then
    select code into v from public.mg_coach_plans where lower(email) = em and code is not null order by published_at desc nulls last limit 1;
  end if;
  if v is null then
    select c.code, coalesce(c.path, 'p-' || c.code) into v, cpath from public.mg_clients c
      where c.email is not null and lower(c.email) = em and c.code ~ '^[0-9]{6}$' limit 1;
    if v is not null and cpath <> 'coach-plan' and not coalesce(p_confirm, false) then
      return jsonb_build_object('confirm', true, 'code', v, 'path', cpath);
    end if;
  end if;
  if v is null then
    loop
      v := (100000 + floor(random() * 900000))::int::text;
      exit when not exists (select 1 from public.mg_clients where code = v);
    end loop;
    insert into public.mg_clients(code, name, plan, path, email) values (v, p.name, 'coach-plan', 'coach-plan', em);
    made := true;
  else
    update public.mg_clients set path = 'coach-plan', plan = 'coach-plan', name = coalesce(nullif(name,''), p.name) where code = v;
    if not found then
      insert into public.mg_clients(code, name, plan, path, email) values (v, p.name, 'coach-plan', 'coach-plan', em);
      made := true;
    end if;
  end if;
  update public.mg_coach_plans set code = v, published_at = now() where id = p_id;
  return jsonb_build_object('ok', true, 'code', v, 'created', made);
end $$;
revoke all on function public.mg_coach_plan_publish(text, text, boolean) from public;
grant execute on function public.mg_coach_plan_publish(text, text, boolean) to anon;

-- Player: the latest plan put in the app for this plan code. Plan code + PIN, same check and lock as mg_load.
create or replace function public.mg_plan_content(p_code text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare e text; d jsonb; t timestamptz;
begin
  e := public.mg_check(p_code, p_pin);
  if e is not null then return jsonb_build_object('error', e); end if;
  select data, published_at into d, t from public.mg_coach_plans where code = p_code and published_at is not null order by published_at desc limit 1;
  if d is null then return jsonb_build_object('error', 'Your coach is still finishing your plan.'); end if;
  return jsonb_build_object('plan', d, 'published_at', t);
end $$;
revoke all on function public.mg_plan_content(text, text) from public;
grant execute on function public.mg_plan_content(text, text) to anon;

-- Coach: suggest a game that isn't in the app yet (same name again updates the description).
create or replace function public.mg_coach_game_suggest(p_pass text, p_name text, p_desc text, p_coach text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass); n text := trim(coalesce(p_name,''));
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  if length(n) < 2 then return jsonb_build_object('error','Give the game a name'); end if;
  update public.mg_game_suggestions set description = left(coalesce(p_desc,''),2000), coach = coalesce(nullif(p_coach,''), coach)
    where lower(name) = lower(n) and status = 'new';
  if not found then
    insert into public.mg_game_suggestions(name, description, coach) values (left(n,120), left(coalesce(p_desc,''),2000), nullif(p_coach,''));
  end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.mg_coach_game_suggest(text, text, text, text) from public;
grant execute on function public.mg_coach_game_suggest(text, text, text, text) to anon;

-- Coach: mark a suggestion added to the app or declined.
create or replace function public.mg_coach_game_status(p_pass text, p_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass);
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  if p_status not in ('new','added','declined') then return jsonb_build_object('error','Unknown status'); end if;
  update public.mg_game_suggestions set status = p_status where id = p_id;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.mg_coach_game_status(text, uuid, text) from public;
grant execute on function public.mg_coach_game_status(text, uuid, text) to anon;

-- Anyone: game suggestions (names and descriptions only, no player details), newest first. Jack's Claude reads this.
create or replace function public.mg_game_suggestions()
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'description',description,'coach',coach,'status',status,'created_at',created_at) order by created_at desc), '[]'::jsonb)
  from public.mg_game_suggestions;
$$;
revoke all on function public.mg_game_suggestions() from public;
grant execute on function public.mg_game_suggestions() to anon;
