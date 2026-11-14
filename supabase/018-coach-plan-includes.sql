-- 018 (Joe, 14 Nov): what a coach-built plan covers, so My Training / My Practice know.
-- mg_clients.includes was never set by "Create app plan", so every coach-built plan counted as training only.
-- Now: Physical ticked + at least one training day -> 'training'; Practice ticked + a session, or On-course ticked + a game -> 'practice'.
-- My Training hard-blocks when the plan includes training; My Practice soft-steers when it includes practice.
-- Run after 014. Safe to run more than once.

create or replace function public.mg_plan_includes(d jsonb)
returns text[] language sql immutable as $$
  select array_remove(array[
    case when coalesce((d->'include'->>'physical')::boolean, true)
          and jsonb_array_length(coalesce(d->'physical'->'dayList','[]'::jsonb)) > 0 then 'training' end,
    case when (coalesce((d->'include'->>'practice')::boolean, true)
               and jsonb_array_length(coalesce(d->'practice'->'sessions','[]'::jsonb)) > 0)
           or (coalesce((d->'include'->>'oncourse')::boolean, true)
               and jsonb_array_length(coalesce(d->'oncourse'->'games','[]'::jsonb)) > 0) then 'practice' end
  ]::text[], null)
$$;
revoke all on function public.mg_plan_includes(jsonb) from public;

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
  update public.mg_clients set includes = public.mg_plan_includes(p.data) where code = v;
  return jsonb_build_object('ok', true, 'code', v, 'created', made);
end $$;
revoke all on function public.mg_coach_plan_publish(text, text, boolean) from public;
grant execute on function public.mg_coach_plan_publish(text, text, boolean) to anon;

-- backfill: every coach-built plan already in the app gets includes from its latest published plan
update public.mg_clients c set includes = public.mg_plan_includes(x.data)
  from (select distinct on (code) code, data from public.mg_coach_plans
         where code is not null and published_at is not null order by code, published_at desc) x
 where c.code = x.code and c.path = 'coach-plan';

select c.code, c.name, c.includes from public.mg_clients c where c.path = 'coach-plan' order by c.created_at;
