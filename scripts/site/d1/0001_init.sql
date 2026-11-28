-- skall.world forms (docs/decisions/skall-world-formlar.md). D1 (SQLite); applied with
-- `npx wrangler d1 migrations apply skall-site --remote` (docs/OPS.md → "skall.world formları").

-- Schools of the campus vote. Only 'approved' ones are listed; an application waits as 'pending'
-- until an admin approves it. name_key is forms.ts → schoolKey(name): one school, one row.
create table schools (
  id integer primary key,
  name text not null,
  name_key text not null unique,
  status text not null check (status in ('approved', 'pending', 'rejected')),
  created_at text not null
);

-- One vote per device: the SHA-256 of the random id the browser keeps. No IP, no person.
create table votes (
  device_hash text primary key,
  school_id integer not null references schools (id),
  created_at text not null
);
create index votes_school on votes (school_id);

-- Per-day counters per salted IP hash (forms.ts → DAILY_LIMITS); kept two days.
create table rate_limits (
  kind text not null,
  ip_hash text not null,
  day text not null,
  count integer not null,
  primary key (kind, ip_hash, day)
);

-- Pilot venue applications (skall.world/mekanlar); kept at most a year (forms.ts → VENUE_KEEP_DAYS).
create table venue_applications (
  id integer primary key,
  venue_name text not null,
  district text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  notice_version text not null,
  created_at text not null,
  emailed_at text
);
create index venue_applications_created on venue_applications (created_at);
