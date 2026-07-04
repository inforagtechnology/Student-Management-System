-- ============================================================
-- Student Management System — Supabase schema + security rules
-- Run this once in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- 1. Roles -----------------------------------------------------
create type user_role as enum ('admin', 'hr', 'student');

-- 2. Profiles ----------------------------------------------------
-- One row per auth user. Holds the role, which is what every
-- permission check below is based on.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'student',
  created_at timestamptz not null default now()
);

-- 3. Students ------------------------------------------------------
-- Extra fields for accounts with role = 'student'.
-- id doubles as a foreign key to profiles.id (1-to-1).
create table if not exists students (
  id uuid primary key references profiles(id) on delete cascade,
  roll_number text unique,
  course text,
  phone text,
  date_of_birth date,
  address text,
  updated_at timestamptz not null default now()
);

-- 4. Auto-create profile + student row on signup -------------------
-- Fires whenever a new row appears in auth.users, i.e. right after
-- someone confirms (or attempts) signup. New self-signups always
-- start as 'student' — only an admin can promote someone to hr/admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'student')
  )
  on conflict (id) do nothing;

  insert into public.students (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Helper: read the caller's own role without triggering
--    infinite RLS recursion on the profiles table.
create or replace function public.get_my_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 6. Row Level Security ---------------------------------------------
alter table profiles enable row level security;
alter table students enable row level security;

-- profiles: everyone can read their own row
create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

-- profiles: admin and hr can read every row
create policy "profiles_select_admin_hr"
  on profiles for select
  using (public.get_my_role() in ('admin', 'hr'));

-- profiles: only admin can change a role or delete an account
create policy "profiles_update_admin"
  on profiles for update
  using (public.get_my_role() = 'admin');

create policy "profiles_delete_admin"
  on profiles for delete
  using (public.get_my_role() = 'admin');

-- students: a student can see and edit their own record
create policy "students_select_own"
  on students for select
  using (auth.uid() = id);

create policy "students_update_own"
  on students for update
  using (auth.uid() = id);

-- students: admin and hr can view every student record
create policy "students_select_admin_hr"
  on students for select
  using (public.get_my_role() in ('admin', 'hr'));

-- students: only admin can edit or delete any student's record
create policy "students_update_admin"
  on students for update
  using (public.get_my_role() = 'admin');

create policy "students_delete_admin"
  on students for delete
  using (public.get_my_role() = 'admin');

-- ============================================================
-- After running this file:
-- 1. Go to Authentication -> Providers -> Email and make sure
--    "Confirm email" is turned ON (this is what makes Supabase
--    send the verification link and block login until it's clicked).
-- 2. Sign up once through the app's normal Signup page, confirm
--    that email, then in Table Editor -> profiles, manually change
--    that one row's role to 'admin'. That becomes your first admin
--    account — every HR/student account after that can be created
--    from inside the app.
-- ============================================================
