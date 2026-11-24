-- Revoca EXECUTE sobre public.rls_auto_enable() a public, anon y authenticated.
--
-- Motivo: el Security Advisor de Supabase (lints 0028 y 0029) avisa de que esta
-- función SECURITY DEFINER, creada por Supabase junto al proyecto, es invocable
-- por anon y authenticated vía /rest/v1/rpc. No es nuestra: no se borra ni se
-- modifica, y tampoco se toca el event trigger ensure_rls que la usa.
--
-- El event trigger sigue funcionando porque Postgres no comprueba el privilegio
-- EXECUTE de la función al disparar un event trigger.
--
-- Solo se aplica si la función existe, para que la migración no falle en una
-- base local que no la tenga.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$$;
