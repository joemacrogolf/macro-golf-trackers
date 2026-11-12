-- 006: My Plan also opens golf personal plans (email + PIN pages like Paul Goddard's).
-- Each golf personal plan gets a registry row in mg_clients: code = its 6-digit Kajabi page number,
-- kind = 'golf', plan = the page name (e.g. golf-paul-goddard). The registry row holds no data and no PIN.
-- The PIN and the saved games stay on the page's own email + PIN row ('pure:<plan>:<email>'), exactly as before.
-- First time: email + plan code + PIN links the email to the registry row (and sets the PIN if the client is new).
-- Add a new golf personal plan:
--   insert into public.mg_clients(code, name, plan, kind) values ('<page number>', '<Full Name>', '<page name>', 'golf');

alter table public.mg_clients add column if not exists kind text;   -- null = 1-to-1 plan, 'golf' = golf personal plan registry row

create or replace function public.mg_myplan(p_email text, p_pin text, p_code text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_clients%rowtype; e text; pc text;
        em text := lower(trim(coalesce(p_email,''))); cd text := trim(coalesce(p_code,'')); linking boolean := false;
begin
  if em = '' or coalesce(p_pin,'') = '' then
    return jsonb_build_object('error','Enter your email and PIN.');
  end if;
  select * into c from public.mg_clients where email is not null and lower(email) = em and code !~ '^pure:' limit 1;
  if not found then
    -- first log-in on My Plan: the plan code links this email to the plan
    if cd = '' then
      return jsonb_build_object('error','First time here? Enter the plan code from your welcome message.','first',true);
    end if;
    select * into c from public.mg_clients where code = cd and code ~ '^[0-9]{6}$';
    if not found then
      return jsonb_build_object('error','That plan code does not match. Check your welcome message.','first',true);
    end if;
    if c.email is not null then
      return jsonb_build_object('error','That plan is linked to a different email. Use that one, or message your coach.','first',true);
    end if;
    linking := true;
  elsif c.kind is distinct from 'golf' and c.pin_hash is null then
    -- 1-to-1 plan whose email was set by the coach but has no PIN yet: the plan code proves it is really them
    if cd = '' then
      return jsonb_build_object('error','First time here? Enter the plan code from your welcome message and choose a PIN.','first',true);
    end if;
    if cd <> c.code then
      update public.mg_clients set fails = fails + 1,
        locked_until = case when fails + 1 >= 8 then now() + interval '15 minutes' else null end
        where code = c.code;
      return jsonb_build_object('error','That plan code does not match. Check your welcome message.','first',true);
    end if;
  end if;
  if c.locked_until is not null and c.locked_until > now() then
    return jsonb_build_object('error','Too many tries. Wait 15 minutes.');
  end if;

  if c.kind = 'golf' then
    -- golf personal plan: the PIN lives on the page's own email + PIN row (created here on first use)
    pc := 'pure:' || c.plan || ':' || em;
    e := public.mg_check(pc, p_pin, c.name, coalesce(c.name,'') || ' Golf Plan');
    if e is not null then return jsonb_build_object('error', e); end if;
    if linking then update public.mg_clients set email = em where code = c.code and email is null; end if;
    return jsonb_build_object('code', c.code, 'kind', 'golf', 'plan', c.plan, 'name', split_part(coalesce(c.name,''),' ',1),
                              'path', coalesce(c.path, 'p-' || c.code));
  end if;

  e := public.mg_check(c.code, p_pin, null, null);   -- sets the PIN on first use, otherwise checks it (with lockout)
  if e is not null then return jsonb_build_object('error', e); end if;
  if linking then update public.mg_clients set email = em where code = c.code and email is null; end if;
  return jsonb_build_object('code', c.code, 'name', split_part(coalesce(c.name,''),' ',1), 'path', coalesce(c.path, 'p-' || c.code));
end $$;

revoke all on function public.mg_myplan(text, text, text) from public;
grant execute on function public.mg_myplan(text, text, text) to anon;

-- Registry rows can't be signed into directly (they hold no data): give them a random PIN nobody knows.
-- (mg_load on a 6-digit code with no PIN would otherwise let the first visitor set one.)

-- Paul Goddard: page p-482615, already signed in with this email, so My Plan works for him with his existing PIN, no code needed.
insert into public.mg_clients(code, name, plan, kind, pin_hash, email)
values ('482615', 'Paul Goddard', 'golf-paul-goddard', 'golf', crypt(gen_random_uuid()::text, gen_salt('bf')),
        (select lower(split_part(code, ':', 3)) from public.mg_clients where code like 'pure:golf-paul-goddard:%' limit 1))
on conflict (code) do nothing;
