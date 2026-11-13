-- 013: MG badge on the golf leaderboards (13 Nov meeting, Jack).
-- mg_leaderboard now also returns mg:true for MG players, and src/leaderboard.js shows the yellow MG mark next to their name.
-- An MG player is anyone who has signed in through MG Athletes (My Plan) with their email + plan code + PIN: that links
-- their email to a 1-to-1 or golf personal plan in mg_clients (005 / 006). A coach-entered email with no PIN yet doesn't count. MG pros who don't have a plan go on the small mg_lb_mg list by the name they type on the
-- leaderboard (Ryan Harmer for now). Add one with:  insert into public.mg_lb_mg(name) values ('First Last');
-- MG coaches (mg_lb_coach: jack@, joe@, sam@macro.golf) come back with coach:true and get the MG Coach badge instead.
-- Includes the weekly board from 011, so running this also switches that on. 'all', 'month' and 'week' work as before.
-- Pages without the new leaderboard.js just ignore the extra field. Run once in the Supabase SQL editor.

create table if not exists public.mg_lb_mg (name text primary key, added timestamptz not null default now());
alter table public.mg_lb_mg enable row level security;   -- no policies: only the leaderboard function reads it
revoke all on public.mg_lb_mg from anon, authenticated;
insert into public.mg_lb_mg(name) values ('Ryan Harmer') on conflict do nothing;

-- MG coaches get the special MG Coach badge (instead of the MG mark) on scores saved with these emails.
-- Add one with:  insert into public.mg_lb_coach(email) values ('name@macro.golf');
create table if not exists public.mg_lb_coach (email text primary key, added timestamptz not null default now());
alter table public.mg_lb_coach enable row level security;   -- no policies: only the leaderboard function reads it
revoke all on public.mg_lb_coach from anon, authenticated;
insert into public.mg_lb_coach(email) values ('jack@macro.golf'), ('joe@macro.golf'), ('sam@macro.golf') on conflict do nothing;

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
           -- MG athlete: a 1-to-1 / golf personal plan code, or an email + PIN record whose email is linked to one
           -- on My Plan (MG Athletes), or a name on the mg_lb_mg list (MG pros)
           ( c.code !~ '^pure:'
             or exists (select 1 from public.mg_clients m
                         where m.email is not null and m.code !~ '^pure:'
                           and (m.kind = 'golf' or m.pin_hash is not null)   -- signed in on MG Athletes (email + PIN set)
                           and lower(m.email) = lower(regexp_replace(c.code, '^pure:[^:]+:', '')))
             or exists (select 1 from public.mg_lb_mg x
                         where lower(regexp_replace(trim(x.name), '\s+', ' ', 'g')) =
                               lower(regexp_replace(trim(coalesce(nullif(trim(c.name),''), s.data->'_mgSummary'->>'player', '')), '\s+', ' ', 'g')))
           ) as mg,
           exists (select 1 from public.mg_lb_coach k
                    where lower(k.email) = lower(regexp_replace(c.code, '^pure:[^:]+:', ''))) as coach
    from public.mg_state s join public.mg_clients c on c.code = s.code
    where s.data->'_mgSummary'->'golf'->>'game' = p_game
      and coalesce((s.data->'_mgSummary'->>'lbHide')::boolean, false) = false
  ),
  r as (
    -- all time: the page's own best; this month: every finished round dated this month
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
