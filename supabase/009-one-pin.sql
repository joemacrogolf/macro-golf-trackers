-- 009: one PIN for everything (docs/app-navigation-plan.md, step 1).
-- A member can have different PINs on different records (1-to-1 plan, Build My Plan, old Pure plans, golf games, Practice Plan).
-- mg_whoami now also returns mixed:true when the PIN typed matches some of this email's records but not all.
-- mg_onepin(email, pin): if the PIN matches at least one of this email's records, every other record of that email
-- (that already has a PIN) gets the same PIN. Wrong PINs count toward the usual lock. Golf registry rows (kind 'golf') are untouched.
-- The My Training / My Practice pages offer this after log-in ("Use this PIN for everything"), never silently.

create or replace function public.mg_whoami(p_email text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  em text := lower(trim(coalesce(p_email,'')));
  r public.mg_clients%rowtype;
  any_rec boolean := false; any_pin boolean := false; ok boolean := false; locked boolean := false; mixed boolean := false;
  one jsonb := null; plans jsonb := '[]'::jsonb; nm text := null;
begin
  if em = '' or coalesce(p_pin,'') = '' then
    return jsonb_build_object('error','Enter your email and PIN.');
  end if;
  for r in
    select * from public.mg_clients
     where kind is distinct from 'golf'
       and ((email is not null and lower(email) = em and code !~ '^pure:')
         or (code like 'pure:%' and lower(regexp_replace(code, '^pure:[^:]+:', '')) = em))
  loop
    any_rec := true;
    if r.locked_until is not null and r.locked_until > now() then locked := true; end if;
    if r.pin_hash is not null then
      any_pin := true;
      if r.pin_hash = crypt(p_pin, r.pin_hash) then ok := true; else mixed := true; end if;
    end if;
  end loop;

  if not any_rec then return jsonb_build_object('new', true); end if;
  if locked then return jsonb_build_object('error','Too many tries. Wait 15 minutes.'); end if;
  if not any_pin then
    return jsonb_build_object('error','Your coach has set up your plan. Open the 1-to-1 Coaching tab and tap "First time here?" to choose your PIN.','first',true);
  end if;
  if not ok then
    update public.mg_clients set fails = fails + 1,
      locked_until = case when fails + 1 >= 8 then now() + interval '15 minutes' else null end
     where kind is distinct from 'golf'
       and ((email is not null and lower(email) = em and code !~ '^pure:')
         or (code like 'pure:%' and lower(regexp_replace(code, '^pure:[^:]+:', '')) = em));
    return jsonb_build_object('error','That PIN does not match.');
  end if;

  update public.mg_clients set fails = 0, locked_until = null
   where kind is distinct from 'golf'
     and ((email is not null and lower(email) = em and code !~ '^pure:')
       or (code like 'pure:%' and lower(regexp_replace(code, '^pure:[^:]+:', '')) = em));

  for r in
    select * from public.mg_clients
     where kind is distinct from 'golf'
       and ((email is not null and lower(email) = em and code !~ '^pure:')
         or (code like 'pure:%' and lower(regexp_replace(code, '^pure:[^:]+:', '')) = em))
     order by created_at
  loop
    if nm is null and r.name is not null then nm := split_part(r.name, ' ', 1); end if;
    if r.code like 'pure:%' then
      plans := plans || jsonb_build_array(jsonb_build_object('plan', split_part(r.code, ':', 2), 'since', r.created_at,
        'hasPlan', coalesce((select jsonb_typeof(st.data->'practice'->'plan') = 'object' from public.mg_state st where st.code = r.code), false)));
    elsif one is null then
      one := jsonb_build_object('code', r.code, 'path', coalesce(r.path, 'p-' || r.code),
                                'includes', coalesce(to_jsonb(r.includes), '["training"]'::jsonb));
    end if;
  end loop;
  return jsonb_build_object('name', nm, 'oneToOne', one, 'plans', plans, 'mixed', mixed);
end $$;

create or replace function public.mg_onepin(p_email text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  em text := lower(trim(coalesce(p_email,'')));
  r public.mg_clients%rowtype;
  ok boolean := false; locked boolean := false; n int := 0; codes jsonb := '[]'::jsonb;
begin
  if em = '' or coalesce(p_pin,'') !~ '^[0-9]{4,8}$' then
    return jsonb_build_object('error','Your PIN is 4 to 8 numbers.');
  end if;
  for r in
    select * from public.mg_clients
     where kind is distinct from 'golf'
       and ((email is not null and lower(email) = em and code !~ '^pure:')
         or (code like 'pure:%' and lower(regexp_replace(code, '^pure:[^:]+:', '')) = em))
  loop
    if r.locked_until is not null and r.locked_until > now() then locked := true; end if;
    if r.pin_hash is not null and r.pin_hash = crypt(p_pin, r.pin_hash) then ok := true; end if;
  end loop;
  if locked then return jsonb_build_object('error','Too many tries. Wait 15 minutes.'); end if;
  if not ok then
    update public.mg_clients set fails = fails + 1,
      locked_until = case when fails + 1 >= 8 then now() + interval '15 minutes' else null end
     where kind is distinct from 'golf'
       and ((email is not null and lower(email) = em and code !~ '^pure:')
         or (code like 'pure:%' and lower(regexp_replace(code, '^pure:[^:]+:', '')) = em));
    return jsonb_build_object('error','That PIN does not match.');
  end if;
  for r in
    select * from public.mg_clients
     where kind is distinct from 'golf'
       and ((email is not null and lower(email) = em and code !~ '^pure:')
         or (code like 'pure:%' and lower(regexp_replace(code, '^pure:[^:]+:', '')) = em))
       and pin_hash is not null
  loop
    codes := codes || to_jsonb(r.code);
    if r.pin_hash <> crypt(p_pin, r.pin_hash) then
      update public.mg_clients set pin_hash = crypt(p_pin, gen_salt('bf')) where code = r.code;
      n := n + 1;
    end if;
  end loop;
  update public.mg_clients set fails = 0, locked_until = null
     where kind is distinct from 'golf'
       and ((email is not null and lower(email) = em and code !~ '^pure:')
         or (code like 'pure:%' and lower(regexp_replace(code, '^pure:[^:]+:', '')) = em));
  return jsonb_build_object('updated', n, 'codes', codes);
end $$;

revoke all on function public.mg_whoami(text, text) from public;
grant execute on function public.mg_whoami(text, text) to anon;
revoke all on function public.mg_onepin(text, text) from public;
grant execute on function public.mg_onepin(text, text) to anon;
