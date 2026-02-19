-- Lab Queue System Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Computers table
create table public.computers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  status text not null default 'available' check (status in ('available', 'occupied', 'maintenance')),
  current_user_id uuid references public.profiles(id) on delete set null,
  session_started_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reservations table
create table public.reservations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  computer_id uuid references public.computers(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'cancelled')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Queue table
create table public.queue (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  computer_id uuid references public.computers(id) on delete cascade,
  position integer not null,
  status text not null default 'waiting' check (status in ('waiting', 'ready', 'called', 'expired')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  called_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info', 'success', 'warning', 'error')),
  read boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index idx_reservations_user_id on public.reservations(user_id);
create index idx_reservations_computer_id on public.reservations(computer_id);
create index idx_reservations_status on public.reservations(status);
create index idx_reservations_start_time on public.reservations(start_time);
create index idx_queue_user_id on public.queue(user_id);
create index idx_queue_status on public.queue(status);
create index idx_queue_position on public.queue(position);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_read on public.notifications(read);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.computers enable row level security;
alter table public.reservations enable row level security;
alter table public.queue enable row level security;
alter table public.notifications enable row level security;

-- RLS Policies for profiles
create policy "Users can view all profiles" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- RLS Policies for computers (all authenticated users can view)
create policy "Anyone can view computers" on public.computers
  for select using (true);

create policy "Only admins can modify computers" on public.computers
  for all using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for reservations
create policy "Users can view all reservations" on public.reservations
  for select using (true);

create policy "Users can create own reservations" on public.reservations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own reservations" on public.reservations
  for update using (auth.uid() = user_id);

create policy "Users can delete own reservations" on public.reservations
  for delete using (auth.uid() = user_id);

-- RLS Policies for queue
create policy "Users can view queue" on public.queue
  for select using (true);

create policy "Users can join queue" on public.queue
  for insert with check (auth.uid() = user_id);

create policy "Users can update own queue entry" on public.queue
  for update using (auth.uid() = user_id);

create policy "Users can leave queue" on public.queue
  for delete using (auth.uid() = user_id);

-- RLS Policies for notifications
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_computers_updated_at
  before update on public.computers
  for each row execute procedure public.handle_updated_at();

create trigger handle_reservations_updated_at
  before update on public.reservations
  for each row execute procedure public.handle_updated_at();

create trigger handle_queue_updated_at
  before update on public.queue
  for each row execute procedure public.handle_updated_at();

-- Insert sample computers
insert into public.computers (name, description, status) values
  ('PC-01', 'Workstation 1 - General Use', 'available'),
  ('PC-02', 'Workstation 2 - General Use', 'available'),
  ('PC-03', 'Workstation 3 - General Use', 'available'),
  ('PC-04', 'Workstation 4 - Programming', 'available'),
  ('PC-05', 'Workstation 5 - Programming', 'available'),
  ('PC-06', 'Workstation 6 - Design', 'available'),
  ('PC-07', 'Workstation 7 - Design', 'available'),
  ('PC-08', 'Workstation 8 - High Performance', 'available'),
  ('PC-09', 'Workstation 9 - High Performance', 'available'),
  ('PC-10', 'Workstation 10 - High Performance', 'available');

-- Enable realtime for tables
alter publication supabase_realtime add table public.computers;
alter publication supabase_realtime add table public.queue;
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.notifications;
