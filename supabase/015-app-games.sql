-- 015: the list of golf games in the app, kept in the database (14 Nov 2026).
-- The Plan Builder's game dropdown and the players' coach-built plans read this list as well as GAMES in src/mg-library.js,
-- so a game Jack adds to the app shows up straight away with no code change. Coaches add one in the Plan Builder
-- (All plans > Games in the app, or "Added to app" on a new game suggestion). Safe to run more than once. Needs 014.

create table if not exists public.mg_app_games (
  path        text primary key check (path ~ '^[a-z0-9-]{3,60}$'),
  name        text not null,
  area        text,
  added_by    text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.mg_app_games enable row level security;

-- Anyone: the active games (name, Kajabi path, area). Read by the Plan Builder and pages/coach-plan.html.
create or replace function public.mg_app_games()
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('name',name,'path',path,'area',area) order by created_at), '[]'::jsonb)
  from public.mg_app_games where active;
$$;
revoke all on function public.mg_app_games() from public;
grant execute on function public.mg_app_games() to anon;

-- Coach: add (or rename / re-area) a game in the app. p_path is the game's page, e.g. 'p-937452'.
-- p_suggestion (optional) marks that new game suggestion as added.
create or replace function public.mg_coach_app_game_add(p_pass text, p_name text, p_path text, p_area text, p_coach text default null, p_suggestion uuid default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare err text := public.mg_coach_gate(p_pass); pth text := lower(trim(coalesce(p_path,'')));
begin
  if err is not null then return jsonb_build_object('error', err); end if;
  pth := regexp_replace(pth, '^(https?://)?(www\.)?macro\.golf/', '');
  pth := regexp_replace(pth, '[?#].*$', '');
  pth := trim(both '/' from pth);
  if pth !~ '^[a-z0-9-]{3,60}$' then return jsonb_build_object('error','Paste the game''s page link, e.g. www.macro.golf/p-123456'); end if;
  if length(trim(coalesce(p_name,''))) < 2 then return jsonb_build_object('error','Give the game a name'); end if;
  insert into public.mg_app_games(path, name, area, added_by) values (pth, left(trim(p_name),80), nullif(trim(coalesce(p_area,'')),''), nullif(trim(coalesce(p_coach,'')),''))
  on conflict (path) do update set name = excluded.name, area = coalesce(excluded.area, mg_app_games.area), active = true;
  if p_suggestion is not null then update public.mg_game_suggestions set status = 'added' where id = p_suggestion; end if;
  return jsonb_build_object('ok', true, 'path', pth);
end $$;
revoke all on function public.mg_coach_app_game_add(text, text, text, text, text, uuid) from public;
grant execute on function public.mg_coach_app_game_add(text, text, text, text, text, uuid) to anon;
