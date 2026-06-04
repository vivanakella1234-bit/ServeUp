-- ─────────────────────────────────────────────────────────────
-- ServeUp: Messages Table Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Enables in-platform messaging between students and coaches
-- so personal contact info is never needed or exposed.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id          uuid default uuid_generate_v4() primary key,
  coach_id    uuid references public.coach_profiles(id) on delete cascade not null,
  student_id  uuid references public.student_profiles(id) on delete cascade not null,
  sender_role text not null check (sender_role in ('coach', 'student')),
  content     text not null,
  read        boolean default false,
  created_at  timestamptz default now()
);

alter table public.messages enable row level security;

-- Coaches and students can only see their own conversations
create policy "Participants can view their own messages"
  on public.messages for select
  using (
    auth.uid() = (select user_id from public.coach_profiles where id = coach_id)
    or
    auth.uid() = (select user_id from public.student_profiles where id = student_id)
  );

-- Either participant can send a message
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = (select user_id from public.coach_profiles where id = coach_id)
    or
    auth.uid() = (select user_id from public.student_profiles where id = student_id)
  );

-- Participants can mark messages as read
create policy "Participants can mark messages read"
  on public.messages for update
  using (
    auth.uid() = (select user_id from public.coach_profiles where id = coach_id)
    or
    auth.uid() = (select user_id from public.student_profiles where id = student_id)
  );

-- Index for fast conversation lookups
create index if not exists messages_coach_student_idx
  on public.messages (coach_id, student_id, created_at desc);
