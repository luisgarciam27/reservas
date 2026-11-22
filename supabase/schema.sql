-- ============================================================================
-- MarIA Citas — Esquema Multi-Tenant PostgreSQL + Supabase Auth + RLS
-- ============================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.
-- Todas las tablas operativas incluyen `negocio_id` con Row Level Security (RLS)
-- y validación en servidor contra doble reserva (`citas` + `bloqueos`).

create extension if not exists "pgcrypto";

-- 1. NEGOCIOS
create table if not exists public.negocios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  slug text not null unique,
  rubro text not null check (rubro in ('veterinaria', 'consultorio', 'salon', 'otro')),
  logo text not null default '📅',
  color text not null default '#4F46E5',
  direccion text not null default '',
  horario text not null default 'Lunes a Sábado · 9:00 a 19:00',
  whatsapp text not null default '',
  plan text not null default 'basico' check (plan in ('basico', 'pro', 'full')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_negocios_owner on public.negocios(owner_id);
create unique index if not exists idx_negocios_slug on public.negocios(lower(slug));

-- 2. MÓDULOS ACTIVOS POR NEGOCIO
create table if not exists public.negocios_modulos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  modulo text not null check (modulo in (
    'agenda', 'servicios', 'recordatorios', 'clientes', 'promos', 'catalogo', 'reportes'
  )),
  activo boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (negocio_id, modulo)
);

-- 3. SERVICIOS
create table if not exists public.servicios (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  nombre text not null,
  duracion text not null default '30 min',
  duracion_min integer not null default 30,
  precio numeric(10, 2) not null default 0,
  descripcion text not null default '',
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_servicios_negocio on public.servicios(negocio_id);

-- 4. PROFESIONALES (opcional en Plan Básico/Pro, múltiple en Plan Full)
create table if not exists public.profesionales (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  nombre text not null,
  especialidad text not null default '',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_profesionales_negocio on public.profesionales(negocio_id);

-- 5. CLIENTES (clientes / pacientes según rubro)
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  nombre text not null,
  telefono text not null,
  ciudad text not null default '',
  notas text not null default '',
  created_at timestamptz not null default now(),
  unique (negocio_id, telefono)
);

create index if not exists idx_clientes_negocio on public.clientes(negocio_id);

-- 6. MASCOTAS (solo utilizado cuando el rubro es veterinaria)
create table if not exists public.mascotas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  cliente_telefono text not null default '',
  nombre text not null,
  especie text not null default 'Perro',
  raza text not null default '',
  notas text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_mascotas_negocio on public.mascotas(negocio_id);

-- 7. PRODUCTOS DE CATÁLOGO (módulo catálogo en Plan Full)
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  nombre text not null,
  precio numeric(10, 2) not null default 0,
  descripcion text not null default '',
  stock integer not null default 10,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_productos_negocio on public.productos(negocio_id);

-- 8. CITAS
create table if not exists public.citas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  servicio_id uuid references public.servicios(id) on delete set null,
  profesional_id uuid references public.profesionales(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  cliente text not null,
  telefono text not null,
  ciudad text not null default '',
  servicio text not null,
  profesional text not null default '',
  precio numeric(10, 2) not null default 0,
  inicio timestamptz not null,
  estado text not null default 'pendiente' check (
    estado in ('pendiente', 'confirmada', 'reprogramar', 'atendido', 'no_asistio', 'cancelada')
  ),
  extra jsonb not null default '{}'::jsonb,
  notas text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_citas_negocio_inicio on public.citas(negocio_id, inicio);
-- Evita doble reserva por negocio y hora (cuando la cita no está cancelada)
create unique index if not exists uq_citas_negocio_slot_activo
  on public.citas(negocio_id, inicio)
  where estado <> 'cancelada';

-- 9. BLOQUEOS DE HORARIO
create table if not exists public.bloqueos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  profesional_id uuid references public.profesionales(id) on delete set null,
  inicio timestamptz not null,
  motivo text not null default 'Bloqueado',
  created_at timestamptz not null default now()
);

create index if not exists idx_bloqueos_negocio_inicio on public.bloqueos(negocio_id, inicio);

-- ============================================================================
-- FUNCIÓN AUXILIAR DE PROPIEDAD PARA RLS
-- ============================================================================
create or replace function public.es_dueno_negocio(p_negocio_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.negocios n
    where n.id = p_negocio_id
      and n.owner_id = auth.uid()
  );
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.negocios enable row level security;
alter table public.negocios_modulos enable row level security;
alter table public.servicios enable row level security;
alter table public.profesionales enable row level security;
alter table public.clientes enable row level security;
alter table public.mascotas enable row level security;
alter table public.productos enable row level security;
alter table public.citas enable row level security;
alter table public.bloqueos enable row level security;

-- NEGOCIOS: público puede leer perfiles públicos (/n/slug); solo dueño edita/crea el suyo
drop policy if exists "negocios_select_public" on public.negocios;
create policy "negocios_select_public"
  on public.negocios for select
  using (true);

drop policy if exists "negocios_insert_owner" on public.negocios;
create policy "negocios_insert_owner"
  on public.negocios for insert
  with check (auth.uid() = owner_id);

drop policy if exists "negocios_update_owner" on public.negocios;
create policy "negocios_update_owner"
  on public.negocios for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "negocios_delete_owner" on public.negocios;
create policy "negocios_delete_owner"
  on public.negocios for delete
  using (auth.uid() = owner_id);

-- NEGOCIOS_MODULOS: lectura pública de módulos activos; escritura solo del dueño
drop policy if exists "modulos_select_public" on public.negocios_modulos;
create policy "modulos_select_public"
  on public.negocios_modulos for select
  using (true);

drop policy if exists "modulos_all_owner" on public.negocios_modulos;
create policy "modulos_all_owner"
  on public.negocios_modulos for all
  using (public.es_dueno_negocio(negocio_id))
  with check (public.es_dueno_negocio(negocio_id));

-- SERVICIOS: lectura pública de servicios activos; dueño gestiona todos
drop policy if exists "servicios_select_public" on public.servicios;
create policy "servicios_select_public"
  on public.servicios for select
  using (activo = true or public.es_dueno_negocio(negocio_id));

drop policy if exists "servicios_all_owner" on public.servicios;
create policy "servicios_all_owner"
  on public.servicios for all
  using (public.es_dueno_negocio(negocio_id))
  with check (public.es_dueno_negocio(negocio_id));

-- PROFESIONALES: lectura pública de activos; dueño gestiona todos
drop policy if exists "profesionales_select_public" on public.profesionales;
create policy "profesionales_select_public"
  on public.profesionales for select
  using (activo = true or public.es_dueno_negocio(negocio_id));

drop policy if exists "profesionales_all_owner" on public.profesionales;
create policy "profesionales_all_owner"
  on public.profesionales for all
  using (public.es_dueno_negocio(negocio_id))
  with check (public.es_dueno_negocio(negocio_id));

-- PRODUCTOS: lectura pública de activos; dueño gestiona todos
drop policy if exists "productos_select_public" on public.productos;
create policy "productos_select_public"
  on public.productos for select
  using (activo = true or public.es_dueno_negocio(negocio_id));

drop policy if exists "productos_all_owner" on public.productos;
create policy "productos_all_owner"
  on public.productos for all
  using (public.es_dueno_negocio(negocio_id))
  with check (public.es_dueno_negocio(negocio_id));

-- CLIENTES Y MASCOTAS: privacidad estricta, solo el dueño de ese negocio lee y edita
drop policy if exists "clientes_owner_only" on public.clientes;
create policy "clientes_owner_only"
  on public.clientes for all
  using (public.es_dueno_negocio(negocio_id))
  with check (public.es_dueno_negocio(negocio_id));

drop policy if exists "mascotas_owner_only" on public.mascotas;
create policy "mascotas_owner_only"
  on public.mascotas for all
  using (public.es_dueno_negocio(negocio_id))
  with check (public.es_dueno_negocio(negocio_id));

-- BLOQUEOS: lectura pública para calcular disponibilidad; dueño gestiona
drop policy if exists "bloqueos_select_public" on public.bloqueos;
create policy "bloqueos_select_public"
  on public.bloqueos for select
  using (true);

drop policy if exists "bloqueos_all_owner" on public.bloqueos;
create policy "bloqueos_all_owner"
  on public.bloqueos for all
  using (public.es_dueno_negocio(negocio_id))
  with check (public.es_dueno_negocio(negocio_id));

-- CITAS: solo el dueño lee/edita/elimina citas de su negocio; público agenda vía RPC o insert validado
drop policy if exists "citas_select_owner" on public.citas;
create policy "citas_select_owner"
  on public.citas for select
  using (public.es_dueno_negocio(negocio_id));

drop policy if exists "citas_update_owner" on public.citas;
create policy "citas_update_owner"
  on public.citas for update
  using (public.es_dueno_negocio(negocio_id))
  with check (public.es_dueno_negocio(negocio_id));

drop policy if exists "citas_delete_owner" on public.citas;
create policy "citas_delete_owner"
  on public.citas for delete
  using (public.es_dueno_negocio(negocio_id));

drop policy if exists "citas_insert_public" on public.citas;
create policy "citas_insert_public"
  on public.citas for insert
  with check (
    exists (select 1 from public.negocios n where n.id = negocio_id)
  );

-- ============================================================================
-- RPC DE DISPONIBILIDAD Y VALIDACIÓN EN SERVIDOR CONTRA DOBLE RESERVA
-- ============================================================================
create or replace function public.horas_ocupadas(p_negocio_id uuid, p_fecha date)
returns table(hora text)
language sql
security definer
as $$
  select to_char(c.inicio at time zone 'America/Lima', 'HH24:00') as hora
  from public.citas c
  where c.negocio_id = p_negocio_id
    and (c.inicio at time zone 'America/Lima')::date = p_fecha
    and coalesce(c.estado, 'pendiente') <> 'cancelada'
  union
  select to_char(b.inicio at time zone 'America/Lima', 'HH24:00') as hora
  from public.bloqueos b
  where b.negocio_id = p_negocio_id
    and (b.inicio at time zone 'America/Lima')::date = p_fecha;
$$;

create or replace function public.reservar_cita(
  p_negocio_id uuid,
  p_cliente text,
  p_telefono text,
  p_ciudad text,
  p_servicio text,
  p_precio numeric,
  p_inicio timestamptz,
  p_profesional text default '',
  p_extra jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_cita_id uuid;
  v_cliente_id uuid;
  v_rubro text;
begin
  select rubro into v_rubro from public.negocios where id = p_negocio_id;
  if v_rubro is null then
    raise exception 'Negocio no encontrado';
  end if;

  -- Validar bloqueo existente en el mismo horario
  if exists (
    select 1 from public.bloqueos
    where negocio_id = p_negocio_id and inicio = p_inicio
  ) then
    raise exception 'Esa hora está bloqueada por el negocio' using errcode = '23505';
  end if;

  -- Validar cita activa existente (el índice único uq_citas_negocio_slot_activo también protege)
  if exists (
    select 1 from public.citas
    where negocio_id = p_negocio_id and inicio = p_inicio and estado <> 'cancelada'
  ) then
    raise exception 'Esa hora ya fue ocupada' using errcode = '23505';
  end if;

  -- Upsert silencioso de cliente para el CRM del dueño
  insert into public.clientes (negocio_id, nombre, telefono, ciudad)
  values (p_negocio_id, trim(p_cliente), trim(p_telefono), coalesce(trim(p_ciudad), ''))
  on conflict (negocio_id, telefono)
  do update set nombre = excluded.nombre, ciudad = excluded.ciudad
  returning id into v_cliente_id;

  -- Si es veterinaria y viene nombreMascota, registrar en mascotas
  if v_rubro = 'veterinaria' and coalesce(p_extra->>'nombreMascota', '') <> '' then
    insert into public.mascotas (negocio_id, cliente_id, cliente_telefono, nombre, especie)
    values (
      p_negocio_id,
      v_cliente_id,
      trim(p_telefono),
      p_extra->>'nombreMascota',
      coalesce(p_extra->>'tipoMascota', 'Perro')
    );
  end if;

  insert into public.citas (
    negocio_id, cliente_id, cliente, telefono, ciudad,
    servicio, profesional, precio, inicio, estado, extra
  ) values (
    p_negocio_id, v_cliente_id, trim(p_cliente), trim(p_telefono), coalesce(trim(p_ciudad), ''),
    p_servicio, coalesce(p_profesional, ''), coalesce(p_precio, 0), p_inicio, 'pendiente', coalesce(p_extra, '{}'::jsonb)
  )
  returning id into v_cita_id;

  return v_cita_id;
end;
$$;
