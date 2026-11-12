-- 007: "who am I?" for the My Training / My Practice front doors (docs/app-navigation-plan.md).
-- One email + PIN → what this member has: a 1-to-1 plan (and which areas it includes) and any email + PIN plans
-- (Build My Plan, old Pure plans, later practice plans). Additive only: a new column and a new function.
--
-- PIN rule: the PIN is checked against every record this email has (1-to-1 row linked by email, and pure:<plan>:<email> rows).
-- If it matches any of them, the member is signed in. Wrong PINs count toward the usual 15-minute lock (8 tries) on all of them.
-- An email with no records at all returns {new:true} so the front door can start a new plan (the plan page creates the record).
-- Returns only plan names, codes and page paths, never anyone's logged data.

alter table public.mg_clients add column if not exists includes text[];   -- 1-to-1 plans: e.g. '{training,practice}'

create or replace function public.mg_whoami(p_email text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  em text := lower(trim(coalesce(p_email,'')));
  r public.mg_clients%rowtype;
  any_rec boolean := false; any_pin boolean := false; ok boolean := false; locked boolean := false;
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
      if r.pin_hash = crypt(p_pin, r.pin_hash) then ok := true; end if;
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
      plans := plans || jsonb_build_array(jsonb_build_object('plan', split_part(r.code, ':', 2), 'since', r.created_at));
    elsif one is null then
      one := jsonb_build_object('code', r.code, 'path', coalesce(r.path, 'p-' || r.code),
                                'includes', coalesce(to_jsonb(r.includes), '["training"]'::jsonb));
    end if;
  end loop;
  return jsonb_build_object('name', nm, 'oneToOne', one, 'plans', plans);
end $$;

revoke all on function public.mg_whoami(text, text) from public;
grant execute on function public.mg_whoami(text, text) to anon;

-- What the existing 1-to-1 plans cover (null = training only). Dan's plan has a Practice tab.
update public.mg_clients set includes = '{training,practice}' where code = '836790' and includes is null;
