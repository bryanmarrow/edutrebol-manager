-- Migration: Allow teachers to insert their own profile + auto-create on signup

-- 1. Add INSERT policy so authenticated users can create their own teacher record
create policy "Teachers can insert own profile" on teachers for
insert with check (auth.uid() = id);

-- 2. Function to auto-create teacher record when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.teachers (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. Trigger that runs after each new auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
