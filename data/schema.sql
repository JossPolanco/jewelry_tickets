-- ==========================================
-- 1. EXTENSIONES Y FUNCIONES AUXILIARES
-- ==========================================
create extension if not exists "uuid-ossp";

-- Trigger genérico para actualizar automaticamente el campo updated_at
create or replace function public.fn_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ==========================================
-- 2. TABLA: ORGANIZACIONES
-- ==========================================
create table public.tbl_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  logo_url text,
  terms_and_conditions text default 'El negocio no se hace responsable por piezas no reclamadas después de 30 días.',
  
  -- Campos de control / auditoría
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone null,
  updated_by uuid references auth.users(id) on delete set null,
  active boolean default true not null
);

create index idx_tbl_organizations_active on public.tbl_organizations(active);

-- ==========================================
-- 3. TABLA: METADATOS DE IMÁGENES
-- ==========================================
create table public.tbl_image_metadata (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  storage_path text not null unique,
  original_name text null,
  mime_type text not null,
  file_size integer not null,
  width integer null,
  height integer null,
  gallery text not null default 'default'::text,
  
  -- Campos de control / auditoría
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone null,
  updated_by uuid references auth.users(id) on delete set null,
  active boolean default true not null
);

create index idx_tbl_image_metadata_uploaded_by on public.tbl_image_metadata(uploaded_by);
create index idx_tbl_image_metadata_bucket_path on public.tbl_image_metadata(bucket, storage_path);

-- ==========================================
-- 4. TABLA: CLIENTES
-- ==========================================
create table public.tbl_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.tbl_organizations(id) on delete cascade not null,
  names text not null,
  lastnames text not null,
  -- Columna calculada para búsquedas globales rápidas por nombre completo
  full_name text generated always as (names || ' ' || lastnames) stored,
  phone text not null,
  email text null,
  
  -- Campos de control / auditoría
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone null,
  updated_by uuid references auth.users(id) on delete set null,
  active boolean default true not null
);

create index idx_tbl_customers_phone on public.tbl_customers(organization_id, phone);
create index idx_tbl_customers_full_name on public.tbl_customers(organization_id, full_name);

-- ==========================================
-- TABLA: ÓRDENES DE SERVICIO
-- ==========================================
create table public.tbl_service_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.tbl_organizations(id) on delete cascade not null,
  customer_id uuid references public.tbl_customers(id) on delete restrict not null,
  
  folio serial not null,
  status text not null default 'Recibido' 
    check (status in ('Recibido', 'En Proceso', 'Listo', 'Entregado', 'Cancelado', 'Pendiente', 'Reparación')),
  
  total_estimated_cost numeric(10, 2) not null default 0.00,
  advance_payment numeric(10, 2) not null default 0.00,
  
  -- Firma digital capturada como vectores/puntos JSON desde react-signature-canvas
  signature_data jsonb null, 
  
  notes_general text,
  promised_date date,
  delivered_at timestamp with time zone null, -- Fecha de entrega final de la orden
  
  -- Campos de control / auditoría
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone null,
  updated_by uuid references auth.users(id) on delete set null,
  active boolean default true not null
);

-- Índices recomendados para la tabla
create index idx_tbl_service_orders_folio on public.tbl_service_orders(organization_id, folio);
create index idx_tbl_service_orders_status on public.tbl_service_orders(organization_id, status);
create index idx_tbl_service_orders_created_at on public.tbl_service_orders(created_at);

-- ==========================================
-- 6. TABLA: ARTÍCULOS DE LA ÓRDEN
-- ==========================================
create table public.tbl_order_items (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid references public.tbl_service_orders(id) on delete cascade not null,
  
  item_type text not null, -- Ej: Anillo, Cadena, Dije
  description text not null,
  initial_weight_grams numeric(8, 3) not null,
  material_details text,
  service_requested text not null,
  
  -- Arreglo de UUIDs pertenecientes a la tabla tbl_image_metadata
  photo_ids uuid[] default '{}'::uuid[],
  delivered_at timestamp with time zone null, -- Control individual por pieza
  
  -- Campos de control / auditoría
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone null,
  updated_by uuid references auth.users(id) on delete set null,
  active boolean default true not null
);

create index idx_tbl_order_items_service_order on public.tbl_order_items(service_order_id);
create index idx_tbl_order_items_active on public.tbl_order_items(active);

-- ==========================================
-- 4. TABLA INTERMEDIA:  USUARIOS POR ORGANIZACIÓN
-- ==========================================
create table public.tbl_organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.tbl_organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'owner' check (role in ('owner', 'admin', 'employee', 'dev')),
  
  -- Campos de auditoría exigidos en tus reglas
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone null,
  updated_by uuid references auth.users(id) on delete set null,
  active boolean default true not null,

  -- Un usuario solo puede pertenecer una vez a la misma organización
  unique(organization_id, user_id)
);

create index idx_tbl_org_members_user on public.tbl_organization_members(user_id);

-- ==========================================
-- 7. TABLA: HISTORIAL DE PAGOS / ABONOS
-- ==========================================
create table public.tbl_payments (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid references public.tbl_service_orders(id) on delete cascade not null,
  amount numeric(10, 2) not null,
  payment_method text default 'efectivo' check (payment_method in ('efectivo', 'tarjeta', 'transferencia')),
  notes text,
  
  -- Campos de control / auditoría
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone null,
  updated_by uuid references auth.users(id) on delete set null,
  active boolean default true not null
);

create index idx_tbl_payments_order on public.tbl_payments(service_order_id);
create index idx_tbl_payments_created_at on public.tbl_payments(created_at);

-- ==========================================
-- 8. TRIGGERS PARA UPDATED_AT
-- ==========================================
create trigger trg_tbl_organizations_updated before update on public.tbl_organizations for each row execute function public.fn_set_updated_at();
create trigger trg_tbl_image_metadata_updated before update on public.tbl_image_metadata for each row execute function public.fn_set_updated_at();
create trigger trg_tbl_customers_updated before update on public.tbl_customers for each row execute function public.fn_set_updated_at();
create trigger trg_tbl_service_orders_updated before update on public.tbl_service_orders for each row execute function public.fn_set_updated_at();
create trigger trg_tbl_order_items_updated before update on public.tbl_order_items for each row execute function public.fn_set_updated_at();
create trigger trg_tbl_payments_updated before update on public.tbl_payments for each row execute function public.fn_set_updated_at();
create trigger trg_tbl_organization_members_updated before update on public.tbl_organization_members for each row execute function public.fn_set_updated_at();


-- ==========================================
-- 9. SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ==========================================
-- Habilitar RLS en todas las tablas
alter table public.tbl_organizations enable row level security;
alter table public.tbl_image_metadata enable row level security;
alter table public.tbl_customers enable row level security;
alter table public.tbl_service_orders enable row level security;
alter table public.tbl_order_items enable row level security;
alter table public.tbl_payments enable row level security;
alter table public.tbl_organization_members enable row level security;

-- Políticas de acceso: Permitir CRUD completo ÚNICAMENTE a usuarios autenticados
create policy "CRUD Autenticados en tbl_organizations" on public.tbl_organizations for all to authenticated using (true) with check (true);
create policy "CRUD Autenticados en tbl_image_metadata" on public.tbl_image_metadata for all to authenticated using (true) with check (true);
create policy "CRUD Autenticados en tbl_customers" on public.tbl_customers for all to authenticated using (true) with check (true);
create policy "CRUD Autenticados en tbl_service_orders" on public.tbl_service_orders for all to authenticated using (true) with check (true);
create policy "CRUD Autenticados en tbl_order_items" on public.tbl_order_items for all to authenticated using (true) with check (true);
create policy "CRUD Autenticados en tbl_payments" on public.tbl_payments for all to authenticated using (true) with check (true);
create policy "CRUD Autenticados en tbl_organization_members" on public.tbl_organization_members for all to authenticated using (true) with check (true);

-- Politica para jewelry-photos
CREATE POLICY "Permitir subida a usuarios autenticados en jewelry-photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'jewelry-photos');

CREATE POLICY "Permitir lectura publica en jewelry-photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'jewelry-photos');