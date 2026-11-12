-- 005: "My Plan" login for 1-to-1 client plans (pages/my-plan.html).
-- One page for every client: email + PIN opens their own plan.
-- First time: email + plan code (the 6-digit code from the welcome message) + PIN. That links the email to the plan,
-- so coaches don't need to enter emails (they can, with: update mg_clients set email = '...' where code = '...').
-- If the client already set a PIN on their personal page, they use that PIN; otherwise the PIN they type becomes theirs.
-- Returns only the plan code, the client's first name and the Kajabi page path, and only after the PIN check.
-- Wrong PINs and wrong first-time plan codes both count toward the existing 15-minute lock (8 tries).

alter table public.mg_clients add column if not exists email text;
alter table public.mg_clients add column if not exists path  text;   -- Kajabi page path when it isn't p-<code> (Kevin: w-849288)

create unique index if not exists mg_clients_email_1to1
  on public.mg_clients (lower(email)) where email is not null and code !~ '^pure:';

create or replace function public.mg_myplan(p_email text, p_pin text, p_code text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.mg_clients%rowtype; e text; em text := lower(trim(coalesce(p_email,''))); cd text := trim(coalesce(p_code,'')); linking boolean := false;
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
  elsif c.pin_hash is null then
    -- email set by the coach but no PIN yet: the plan code proves it is really them
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
  e := public.mg_check(c.code, p_pin, null, null);   -- sets the PIN on first use, otherwise checks it (with lockout)
  if e is not null then return jsonb_build_object('error', e); end if;
  if linking then update public.mg_clients set email = em where code = c.code and email is null; end if;
  return jsonb_build_object('code', c.code, 'name', split_part(coalesce(c.name,''),' ',1), 'path', coalesce(c.path, 'p-' || c.code));
end $$;

revoke all on function public.mg_myplan(text, text, text) from public;
grant execute on function public.mg_myplan(text, text, text) to anon;

-- Kevin's Kajabi page isn't p-<code>
update public.mg_clients set path = 'w-849288' where code = '849288';
