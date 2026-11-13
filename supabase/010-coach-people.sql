-- 010: coach dashboard, one row per person.
-- Same coach password and 15-minute lock as mg_coach_all (003), which stays as it is for anything still using it.
-- Adds what the dashboard needs to group records by person: email (1-to-1 rows linked on My Plan), kind
-- (null = 1-to-1, 'golf' = golf personal plan registry row), path and includes. pure:<plan>:<email> rows carry
-- the email in their code. Read only. Safe to run more than once.
create or replace function public.mg_coach_people(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare k public.mg_coach%rowtype; rows jsonb;
begin
  select * into k from public.mg_coach where id = 1;
  if k.locked_until is not null and k.locked_until > now() then return jsonb_build_object('error','Too many tries. Wait 15 minutes.'); end if;
  if k.pass_hash is null or k.pass_hash <> crypt(p_pass, k.pass_hash) then
    update public.mg_coach set fails = fails + 1,
      locked_until = case when fails + 1 >= 8 then now() + interval '15 minutes' else null end where id = 1;
    return jsonb_build_object('error','Wrong password');
  end if;
  update public.mg_coach set fails = 0, locked_until = null where id = 1;
  select coalesce(jsonb_agg(jsonb_build_object(
           'code', c.code, 'name', c.name, 'plan', c.plan, 'kind', c.kind, 'email', c.email, 'path', c.path,
           'includes', to_jsonb(c.includes), 'created_at', c.created_at, 'data', s.data, 'updated_at', s.updated_at)
         order by s.updated_at desc nulls last), '[]'::jsonb)
    into rows from public.mg_clients c left join public.mg_state s on s.code = c.code;
  return jsonb_build_object('rows', rows);
end $$;

revoke all on function public.mg_coach_people(text) from public;
grant execute on function public.mg_coach_people(text) to anon;
