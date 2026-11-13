-- 011: adds a weekly golf leaderboard (p_period = 'week': best finished round since Monday, UK time).
-- Same function as 004 with one more period; 'all' and 'month' work exactly as before, so every live page keeps working.
-- Used by the game-done screen ("2nd this week") in src/leaderboard.js (MGBoard.rank). Until this is run, pages fall back to this month.
-- Run once in the Supabase SQL editor.

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
           s.data->'_mgSummary'->'golf' as gs
    from public.mg_state s join public.mg_clients c on c.code = s.code
    where s.data->'_mgSummary'->'golf'->>'game' = p_game
      and coalesce((s.data->'_mgSummary'->>'lbHide')::boolean, false) = false
  ),
  r as (
    -- all time: the page's own best; this month: every finished round dated this month
    select code, nm, gs->>'better' as better, gs->>'unit' as unit,
           (gs->>'best')::numeric as sc, left(gs->>'bestAt',10) as d
      from g where p_period = 'all' and (gs->>'best') ~ '^-?[0-9]+(\.[0-9]+)?$'
    union all
    select code, nm, gs->>'better', gs->>'unit', (x->>'s')::numeric, left(x->>'d',10)
      from g, jsonb_array_elements(case when jsonb_typeof(gs->'rounds')='array' then gs->'rounds' else '[]'::jsonb end) x
      where p_period in ('month','week') and (x->>'s') ~ '^-?[0-9]+(\.[0-9]+)?$'
        and (x->>'d') ~ '^\d{4}-\d{2}-\d{2}' and left(x->>'d',10)::date >= m_start
  ),
  b as (
    select distinct on (code) code, nm, better, unit, sc, d from r
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
           's', sc, 'd', d, 'me', (p_me is not null and code = p_me))
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
