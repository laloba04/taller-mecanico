-- Defensa en la BD del flujo de estados de las órdenes (D11).
--
-- 1. Una orden nace en 'recibido' y su estado solo avanza al siguiente inmediato:
--    recibido → en_reparacion → listo → entregado (sin saltos ni retrocesos).
-- 2. fecha_entrega la pone la BD (now()) al pasar a 'entregado'; no se puede
--    fijar ni cambiar a mano.
-- 3. Una orden 'entregado' no admite cambios de descripción, IVA ni vehículo,
--    y sus líneas no se pueden insertar, modificar ni borrar.
--    Borrar la orden completa sí está permitido (y arrastra sus líneas).
--
-- Todos los rechazos usan errcode 'P0001' con un mensaje fijo; la app lo
-- traduce a un texto en español sin mostrar el mensaje interno (D17).
--
-- Funciones SECURITY INVOKER (por defecto) con search_path vacío y nombres
-- calificados. Las RLS siguen aplicándose a las consultas que hacen.
-- Al devolver `trigger` no son invocables por /rest/v1/rpc; aun así se revoca
-- EXECUTE a public, anon y authenticated. Postgres no comprueba ese privilegio
-- al disparar un trigger, así que los triggers siguen funcionando.

-- =========================================================
-- ordenes: estado inicial, transiciones y fecha de entrega
-- =========================================================

create or replace function public.validar_estado_orden()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.estado is distinct from 'recibido' then
      raise exception using
        errcode = 'P0001',
        message = 'transicion_orden_no_permitida';
    end if;
    new.fecha_entrega := null;
    return new;
  end if;

  -- UPDATE
  if old.estado = 'entregado' and (
       new.descripcion is distinct from old.descripcion
       or new.iva_porcentaje is distinct from old.iva_porcentaje
       or new.vehiculo_id is distinct from old.vehiculo_id
     ) then
    raise exception using
      errcode = 'P0001',
      message = 'transicion_orden_no_permitida';
  end if;

  if new.estado is distinct from old.estado then
    if not (
         (old.estado = 'recibido' and new.estado = 'en_reparacion')
      or (old.estado = 'en_reparacion' and new.estado = 'listo')
      or (old.estado = 'listo' and new.estado = 'entregado')
    ) then
      raise exception using
        errcode = 'P0001',
        message = 'transicion_orden_no_permitida';
    end if;

    if new.estado = 'entregado' then
      new.fecha_entrega := pg_catalog.now();
    else
      new.fecha_entrega := null;
    end if;
  else
    -- Sin cambio de estado, fecha_entrega no se toca.
    new.fecha_entrega := old.fecha_entrega;
  end if;

  return new;
end;
$$;

revoke execute on function public.validar_estado_orden() from public, anon, authenticated;

create trigger ordenes_validar_estado
  before insert or update on public.ordenes
  for each row
  execute function public.validar_estado_orden();

-- =========================================================
-- lineas_orden: bloqueadas si la orden está entregada
-- =========================================================

create or replace function public.bloquear_lineas_orden_entregada()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  ids uuid[];
begin
  if tg_op = 'INSERT' then
    ids := array[new.orden_id];
  elsif tg_op = 'UPDATE' then
    ids := array[old.orden_id, new.orden_id];
  else
    ids := array[old.orden_id];
  end if;

  -- Si la orden ya no existe (borrado en cascada de la orden, el vehículo o
  -- el cliente), no se encuentra y el borrado de la línea sigue adelante.
  if exists (
    select 1
    from public.ordenes o
    where o.id = any (ids)
      and o.estado = 'entregado'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'transicion_orden_no_permitida';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke execute on function public.bloquear_lineas_orden_entregada() from public, anon, authenticated;

create trigger lineas_orden_bloquear_entregada
  before insert or update or delete on public.lineas_orden
  for each row
  execute function public.bloquear_lineas_orden_entregada();
