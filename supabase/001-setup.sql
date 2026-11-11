-- MACRO GOLF TRACKERS: database setup
-- Paste all of this into Supabase > SQL Editor > New query, change the coach password on the last line, then press Run.

create extension if not exists pgcrypto with schema extensions;

-- One row per client (personal pages use their page number; Pure plan clients sign up with email + PIN)
create table if not exists public.mg_clients (
  code        text primary key,
  name        text,
  plan        text,
  pin_hash    text,
  fails       int not null default 0,
  locked_until timestamptz,
  created_at  timestamptz not null default now()
);

-- Each client's tracker data (everything they log)
create table if not exists public.mg_state (
  code       text primary key references public.mg_clients(code) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Coach password (for your dashboard)
create table if not exists public.mg_coach (
  id        int primary key default 1,
  pass_hash text not null
);

-- Lock the tables: nobody can read or write them directly from a web page.
alter table public.mg_clients enable row level security;
alter table public.mg_state   enable row level security;
alter table public.mg_coach   enable row level security;

-- Check a client's PIN (sets it on first use). Locks for 15 minutes after 8 wrong tries.
create or replace function public.mg_check(p_code text, p_pin text, p_name text default null, p_plan text default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_clients%rowtype;
begin
  if p_pin is null or length(p_pin) < 4 then raise exception 'PIN must be at least 4 digits'; end if;
  select * into c from public.mg_clients where code = p_code;
  if not found then
    if p_code like 'pure:%' then
      insert into public.mg_clients(code, name, plan, pin_hash) values (p_code, p_name, p_plan, crypt(p_pin, gen_salt('bf')));
      return;
    end if;
    raise exception 'Unknown plan code';
  end if;
  if c.locked_until is not null and c.locked_until > now() then raise exception 'Too many tries. Wait 15 minutes.'; end if;
  if c.pin_hash is null then
    update public.mg_clients set pin_hash = crypt(p_pin, gen_salt('bf')), fails = 0 where code = p_code;
  elsif c.pin_hash <> crypt(p_pin, c.pin_hash) then
    update public.mg_clients set fails = fails + 1,
      locked_until = case when fails + 1 >= 8 then now() + interval '15 minutes' else null end
      where code = p_code;
    raise exception 'Wrong PIN';
  else
    update public.mg_clients set fails = 0, locked_until = null where code = p_code;
  end if;
end $$;

create or replace function public.mg_load(p_code text, p_pin text, p_name text default null, p_plan text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare d jsonb;
begin
  perform public.mg_check(p_code, p_pin, p_name, p_plan);
  select data into d from public.mg_state where code = p_code;
  return jsonb_build_object('data', coalesce(d, '{}'::jsonb));
end $$;

create or replace function public.mg_save(p_code text, p_pin text, p_data jsonb)
returns timestamptz language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.mg_check(p_code, p_pin);
  insert into public.mg_state(code, data, updated_at) values (p_code, p_data, now())
    on conflict (code) do update set data = excluded.data, updated_at = now();
  return now();
end $$;

-- Coach dashboard: every client and their data, only with the coach password
create or replace function public.mg_coach_all(p_pass text)
returns table(code text, name text, plan text, data jsonb, updated_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from public.mg_coach where id = 1 and pass_hash = crypt(p_pass, pass_hash)) then
    raise exception 'Wrong password';
  end if;
  return query select c.code, c.name, c.plan, s.data, s.updated_at
    from public.mg_clients c left join public.mg_state s on s.code = c.code
    order by s.updated_at desc nulls last;
end $$;

revoke all on function public.mg_check(text, text, text, text) from public, anon, authenticated;
grant execute on function public.mg_load(text, text, text, text)  to anon;
grant execute on function public.mg_save(text, text, jsonb)       to anon;
grant execute on function public.mg_coach_all(text)               to anon;

-- Your personal clients (page numbers)
insert into public.mg_clients(code, name, plan) values
  ('836790', 'Dan Jones', 'Six-week performance plan'),
  ('472915', 'Harry',     'Full-body strength'),
  ('849288', 'Kevin',     'Circuit training')
on conflict (code) do nothing;

-- CHANGE THIS to your own coach password before pressing Run
insert into public.mg_coach(id, pass_hash) values (1, crypt('CHANGE-THIS-PASSWORD', gen_salt('bf')))
on conflict (id) do update set pass_hash = excluded.pass_hash;
