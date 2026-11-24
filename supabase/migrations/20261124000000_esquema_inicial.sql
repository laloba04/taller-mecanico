-- Esquema inicial del taller: clientes, vehículos, órdenes y líneas de orden.
-- Cada fila pertenece a un usuario (user_id) y RLS limita el acceso a sus propios datos.
-- Las FKs compuestas (x_id, user_id) impiden enlazar filas de otro usuario.

-- =========================================================
-- Tablas
-- =========================================================

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  telefono text,
  email text,
  notas text,
  created_at timestamptz not null default now(),
  constraint clientes_id_user_id_key unique (id, user_id)
);

create table public.vehiculos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id uuid not null,
  matricula text not null,
  marca text,
  modelo text,
  anio int,
  kilometros int,
  created_at timestamptz not null default now(),
  constraint vehiculos_matricula_formato check (matricula ~ '^[A-Z0-9]+$'),
  constraint vehiculos_kilometros_positivos check (kilometros >= 0),
  constraint vehiculos_user_id_matricula_key unique (user_id, matricula),
  constraint vehiculos_id_user_id_key unique (id, user_id),
  constraint vehiculos_cliente_fkey foreign key (cliente_id, user_id)
    references public.clientes (id, user_id) on delete cascade
);

create table public.ordenes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vehiculo_id uuid not null,
  estado text not null default 'recibido',
  descripcion text,
  iva_porcentaje int not null default 21,
  fecha_entrada timestamptz not null default now(),
  fecha_entrega timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ordenes_estado_valido check (estado in ('recibido', 'en_reparacion', 'listo', 'entregado')),
  constraint ordenes_iva_rango check (iva_porcentaje between 0 and 100),
  constraint ordenes_id_user_id_key unique (id, user_id),
  constraint ordenes_vehiculo_fkey foreign key (vehiculo_id, user_id)
    references public.vehiculos (id, user_id) on delete cascade
);

create table public.lineas_orden (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  orden_id uuid not null,
  tipo text not null,
  descripcion text not null,
  cantidad numeric(10, 2) not null,
  precio_unitario_centimos integer not null,
  created_at timestamptz not null default now(),
  constraint lineas_orden_tipo_valido check (tipo in ('pieza', 'mano_obra')),
  constraint lineas_orden_cantidad_positiva check (cantidad > 0),
  constraint lineas_orden_precio_positivo check (precio_unitario_centimos >= 0),
  constraint lineas_orden_orden_fkey foreign key (orden_id, user_id)
    references public.ordenes (id, user_id) on delete cascade
);

-- =========================================================
-- Índices (user_id y cada FK)
-- =========================================================

create index clientes_user_id_idx on public.clientes (user_id);

create index vehiculos_user_id_idx on public.vehiculos (user_id);
create index vehiculos_cliente_id_user_id_idx on public.vehiculos (cliente_id, user_id);
-- (user_id, matricula) ya queda indexado por la restricción unique vehiculos_user_id_matricula_key.

create index ordenes_user_id_idx on public.ordenes (user_id);
create index ordenes_vehiculo_id_user_id_idx on public.ordenes (vehiculo_id, user_id);

create index lineas_orden_user_id_idx on public.lineas_orden (user_id);
create index lineas_orden_orden_id_user_id_idx on public.lineas_orden (orden_id, user_id);

-- =========================================================
-- updated_at automático en órdenes
-- =========================================================

create or replace function public.actualizar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger ordenes_actualizar_updated_at
  before update on public.ordenes
  for each row
  execute function public.actualizar_updated_at();

-- =========================================================
-- Row Level Security: cada usuario solo accede a sus filas
-- (select auth.uid()) = user_id equivale a auth.uid() = user_id,
-- evaluado una sola vez por consulta (recomendación de Supabase).
-- =========================================================

alter table public.clientes enable row level security;
alter table public.vehiculos enable row level security;
alter table public.ordenes enable row level security;
alter table public.lineas_orden enable row level security;

-- clientes
create policy "clientes_select_propios" on public.clientes
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "clientes_insert_propios" on public.clientes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "clientes_update_propios" on public.clientes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "clientes_delete_propios" on public.clientes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- vehiculos
create policy "vehiculos_select_propios" on public.vehiculos
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "vehiculos_insert_propios" on public.vehiculos
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "vehiculos_update_propios" on public.vehiculos
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "vehiculos_delete_propios" on public.vehiculos
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ordenes
create policy "ordenes_select_propias" on public.ordenes
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "ordenes_insert_propias" on public.ordenes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "ordenes_update_propias" on public.ordenes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "ordenes_delete_propias" on public.ordenes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- lineas_orden
create policy "lineas_orden_select_propias" on public.lineas_orden
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lineas_orden_insert_propias" on public.lineas_orden
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lineas_orden_update_propias" on public.lineas_orden
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lineas_orden_delete_propias" on public.lineas_orden
  for delete to authenticated
  using ((select auth.uid()) = user_id);
