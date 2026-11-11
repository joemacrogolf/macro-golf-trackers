-- 002: make the wrong-PIN counter stick.
-- Raising an exception rolls back the whole request, including "fails = fails + 1",
-- so lockout never triggered. Now the check returns an error message instead of raising,
-- and mg_load / mg_save return {"error": "..."} with HTTP 200 so the counter is committed.

drop function if exists public.mg_load(text, text, text, text);
drop function if exists public.mg_save(text, text, jsonb);
drop function if exists public.mg_check(text, text, text, text);

create function public.mg_check(p_code text, p_pin text, p_name text default null, p_plan text default null)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_clients%rowtype;
begin
  if p_pin is null or length(p_pin) < 4 then return 'PIN must be at least 4 digits'; end if;
  select * into c from public.mg_clients where code = p_code;
  if not found then
    if p_code like 'pure:%' then
      insert into public.mg_clients(code, name, plan, pin_hash) values (p_code, p_name, p_plan, crypt(p_pin, gen_salt('bf')));
      return null;
    end if;
    return 'Unknown plan code';
  end if;
  if c.locked_until is not null and c.locked_until > now() then return 'Too many tries. Wait 15 minutes.'; end if;
  if c.pin_hash is null then
    update public.mg_clients set pin_hash = crypt(p_pin, gen_salt('bf')), fails = 0, locked_until = null where code = p_code;
  elsif c.pin_hash <> crypt(p_pin, c.pin_hash) then
    update public.mg_clients set fails = fails + 1,
      locked_until = case when fails + 1 >= 8 then now() + interval '15 minutes' else null end
      where code = p_code;
    return 'Wrong PIN';
  else
    update public.mg_clients set fails = 0, locked_until = null where code = p_code;
  end if;
  return null;
end $$;

create function public.mg_load(p_code text, p_pin text, p_name text default null, p_plan text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare e text; d jsonb;
begin
  e := public.mg_check(p_code, p_pin, p_name, p_plan);
  if e is not null then return jsonb_build_object('error', e); end if;
  select data into d from public.mg_state where code = p_code;
  return jsonb_build_object('data', coalesce(d, '{}'::jsonb));
end $$;

create function public.mg_save(p_code text, p_pin text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare e text;
begin
  e := public.mg_check(p_code, p_pin);
  if e is not null then return jsonb_build_object('error', e); end if;
  insert into public.mg_state(code, data, updated_at) values (p_code, p_data, now())
    on conflict (code) do update set data = excluded.data, updated_at = now();
  return jsonb_build_object('saved', now());
end $$;

revoke all on function public.mg_check(text, text, text, text) from public, anon, authenticated;
revoke all on function public.mg_load(text, text, text, text) from public;
revoke all on function public.mg_save(text, text, jsonb) from public;
grant execute on function public.mg_load(text, text, text, text) to anon;
grant execute on function public.mg_save(text, text, jsonb)      to anon;

-- remove the self-test client created while checking the live connection
delete from public.mg_clients where code = 'pure:selftest:claude-test@macro.golf';
