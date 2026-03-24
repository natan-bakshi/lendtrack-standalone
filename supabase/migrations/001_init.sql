-- =============================================
-- LendTrack - Supabase Schema
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Debts
create table if not exists public.debts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  borrower_name text not null,
  amount numeric(12,2) not null,
  loan_date date,
  shared_with text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Payment Plans (נפרד מה-debt)
create table if not exists public.payment_plans (
  id uuid primary key default uuid_generate_v4(),
  debt_id uuid references public.debts(id) on delete cascade not null,
  monthly_amount numeric(12,2) not null,
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamptz default now()
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  debt_id uuid references public.debts(id) on delete cascade not null,
  amount numeric(12,2) not null,
  date date not null,
  notes text,
  created_at timestamptz default now()
);

-- Debt Increases
create table if not exists public.debt_increases (
  id uuid primary key default uuid_generate_v4(),
  debt_id uuid references public.debts(id) on delete cascade not null,
  amount numeric(12,2) not null,
  date date not null,
  notes text,
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.debts enable row level security;
alter table public.payment_plans enable row level security;
alter table public.payments enable row level security;
alter table public.debt_increases enable row level security;

-- Debts: owner או shared_with
create policy "debts_select" on public.debts for select
  using (user_id = auth.uid() or auth.jwt()->>'email' = any(shared_with));

create policy "debts_insert" on public.debts for insert
  with check (user_id = auth.uid());

create policy "debts_update" on public.debts for update
  using (user_id = auth.uid() or auth.jwt()->>'email' = any(shared_with));

create policy "debts_delete" on public.debts for delete
  using (user_id = auth.uid());

-- Payment Plans: דרך ה-debt
create policy "payment_plans_all" on public.payment_plans for all
  using (
    exists (
      select 1 from public.debts
      where debts.id = payment_plans.debt_id
      and (debts.user_id = auth.uid() or auth.jwt()->>'email' = any(debts.shared_with))
    )
  );

-- Payments: דרך ה-debt
create policy "payments_all" on public.payments for all
  using (
    exists (
      select 1 from public.debts
      where debts.id = payments.debt_id
      and (debts.user_id = auth.uid() or auth.jwt()->>'email' = any(debts.shared_with))
    )
  );

-- Debt Increases: דרך ה-debt
create policy "debt_increases_all" on public.debt_increases for all
  using (
    exists (
      select 1 from public.debts
      where debts.id = debt_increases.debt_id
      and (debts.user_id = auth.uid() or auth.jwt()->>'email' = any(debts.shared_with))
    )
  );

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger debts_updated_at
  before update on public.debts
  for each row execute procedure public.handle_updated_at();
