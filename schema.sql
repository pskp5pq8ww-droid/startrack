-- DepotOps reference schema for a future backend.
-- The current prototype uses localStorage through the same entity names.

create table users (
  id text primary key,
  role text not null check (role in ('driver', 'supervisor', 'admin')),
  first_name text not null,
  last_name text not null,
  email text unique not null,
  employee_id text unique,
  password_hash text,
  supervisor_id text references users(id),
  default_route_id text references routes(id),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table routes (
  id text primary key,
  route_number text unique not null,
  depot text not null,
  zone text,
  status text not null default 'active' check (status in ('active', 'inactive'))
);

create table kpi_submissions (
  id text primary key,
  driver_id text not null references users(id),
  supervisor_id text references users(id),
  submission_date date not null,
  driver_type text not null,
  route_id text references routes(id),
  start_time time not null,
  finish_time time not null,
  hours numeric(5,2) not null,
  break_minutes integer not null,
  break_approved_by text,
  offroad_duties boolean not null default false,
  offroad_notes text,
  stops integer not null default 0,
  parcels integer not null default 0,
  incidents text,
  comments text,
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'reviewed')),
  created_at timestamptz not null default now()
);

create table holiday_requests (
  id text primary key,
  driver_id text not null references users(id),
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by text references users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table daily_metrics (
  id text primary key,
  metric_date date not null,
  route_id text references routes(id),
  total_stops integer not null default 0,
  total_parcels integer not null default 0,
  total_hours numeric(7,2) not null default 0,
  drivers_submitted integer not null default 0,
  drivers_pending integer not null default 0,
  average_stops_per_driver numeric(7,2) not null default 0,
  generated_at timestamptz not null default now(),
  unique(metric_date, route_id)
);
