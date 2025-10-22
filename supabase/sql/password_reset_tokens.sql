create extension if not exists "pgcrypto";

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  otp_hash text not null,
  otp_salt text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  locked_until timestamptz,
  verified_at timestamptz,
  session_token text,
  session_token_expires_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.password_reset_tokens enable row level security;

create policy "service role manage password resets"
  on public.password_reset_tokens
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
