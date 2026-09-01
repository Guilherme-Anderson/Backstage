-- ============================================================
-- Backstage — cadastro só por convite (sem necessidade de service_role)
-- Um e-mail só consegue criar acesso se um admin já tiver criado a
-- pessoa em public.users com papel de login e sem auth_user_id.
-- ============================================================
create or replace function public.tg_gate_auth_signup()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (
    select 1 from public.users
    where auth_user_id is null
      and email is not null
      and lower(email) = lower(new.email)
      and role in ('admin_geral', 'coordenador')
  ) then
    raise exception 'E-mail não autorizado. Peça a um administrador para cadastrar você primeiro.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
revoke execute on function public.tg_gate_auth_signup() from public, anon, authenticated;

create trigger gate_auth_signup
  before insert on auth.users
  for each row execute function public.tg_gate_auth_signup();
