-- ─────────────────────────────────────────────
-- ServeUp Database Schema
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES (extends Supabase auth.users) ──
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('coach','student','admin')),
  full_name text not null,
  email text not null,
  avatar_url text,
  timezone text default 'America/New_York',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- ── COACH PROFILES ──
create table public.coach_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  city text not null,
  state text,
  primary_venue text,
  utr_rating numeric(4,1),
  utr_verified boolean default false,
  college_level text,
  college_school text,
  itf_ranking text,
  certifications text[],
  specialties text[] not null default '{}',
  session_types text[] not null default '{in-person}',
  travels_to_student boolean default false,
  hourly_rate integer not null,
  languages text[] default '{English}',
  bio text,
  rating_avg numeric(3,2) default 0,
  review_count integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.coach_profiles enable row level security;
create policy "Coach profiles viewable by all" on public.coach_profiles for select using (true);
create policy "Coaches manage own profile" on public.coach_profiles for all using (auth.uid() = user_id);

-- ── STUDENT PROFILES ──
create table public.student_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  city text,
  zip_code text,
  skill_level text check (skill_level in ('beginner','intermediate','advanced','competitive')),
  utr_rating numeric(4,1),
  goals text[],
  preferred_session_type text default 'in-person',
  home_court text,
  created_at timestamptz default now()
);
alter table public.student_profiles enable row level security;
create policy "Students manage own profile" on public.student_profiles for all using (auth.uid() = user_id);

-- ── AVAILABILITY ──
create table public.availability (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references public.coach_profiles(id) on delete cascade not null,
  day_of_week integer check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);
alter table public.availability enable row level security;
create policy "Availability viewable by all" on public.availability for select using (true);
create policy "Coaches manage own availability" on public.availability for all
  using (auth.uid() = (select user_id from public.coach_profiles where id = coach_id));

-- ── BOOKINGS ──
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references public.coach_profiles(id) not null,
  student_id uuid references public.student_profiles(id) not null,
  session_type text not null default 'in-person',
  duration_mins integer not null default 60,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location_address text,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  total_amount integer not null,
  platform_fee integer not null,
  coach_payout integer not null,
  stripe_payment_intent_id text,
  notes text,
  created_at timestamptz default now()
);
alter table public.bookings enable row level security;
create policy "Coach sees own bookings" on public.bookings for select
  using (auth.uid() = (select user_id from public.coach_profiles where id = coach_id));
create policy "Student sees own bookings" on public.bookings for select
  using (auth.uid() = (select user_id from public.student_profiles where id = student_id));
create policy "Students create bookings" on public.bookings for insert with check (
  auth.uid() = (select user_id from public.student_profiles where id = student_id)
);
create policy "Coaches update booking status" on public.bookings for update
  using (auth.uid() = (select user_id from public.coach_profiles where id = coach_id));

-- ── REVIEWS ──
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.bookings(id) on delete cascade unique not null,
  coach_id uuid references public.coach_profiles(id) not null,
  student_id uuid references public.student_profiles(id) not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);
alter table public.reviews enable row level security;
create policy "Reviews viewable by all" on public.reviews for select using (true);
create policy "Students create reviews" on public.reviews for insert with check (
  auth.uid() = (select user_id from public.student_profiles where id = student_id)
);

-- ── Update coach rating on new review ──
create or replace function update_coach_rating()
returns trigger as $$
begin
  update public.coach_profiles
  set
    rating_avg = (select avg(rating) from public.reviews where coach_id = new.coach_id),
    review_count = (select count(*) from public.reviews where coach_id = new.coach_id)
  where id = new.coach_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_created
  after insert on public.reviews
  for each row execute function update_coach_rating();

-- ── Auto-create profile on signup ──
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
