-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Teachers Table (Extends Auth)
create table teachers (
  id uuid references auth.users not null primary key,
  email text not null,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Classes Table
create table classes (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references teachers(id) not null,
  name text not null, -- e.g. "Matemáticas"
  grade integer not null, -- e.g. 1, 2, 3
  section text not null, -- e.g. "B"
  schedule jsonb, -- Stores days and times
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Students Table
create table students (
  id uuid default uuid_generate_v4() primary key,
  class_id uuid references classes(id) on delete cascade not null,
  first_name text not null,
  last_name text not null,
  student_id_official text, -- ID de la escuela
  avatar_url text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Attendance Sessions (One per class per day)
create table attendance_sessions (
  id uuid default uuid_generate_v4() primary key,
  class_id uuid references classes(id) on delete cascade not null,
  date date not null,
  finalized boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(class_id, date)
);

-- 5. Attendance Records (Individual student status)
create type attendance_status as enum ('present', 'absent', 'late');

create table attendance_records (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references attendance_sessions(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  status attendance_status default 'present',
  notes text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, student_id)
);

-- Indexes for Performance
create index idx_classes_teacher on classes (teacher_id);

create index idx_students_class on students (class_id);

create index idx_sessions_class_date on attendance_sessions (class_id, date);

create index idx_records_session on attendance_records (session_id);

create index idx_records_student on attendance_records (student_id);

-- Row Level Security (RLS)
alter table teachers enable row level security;

alter table classes enable row level security;

alter table students enable row level security;

alter table attendance_sessions enable row level security;

alter table attendance_records enable row level security;

-- Policies
-- Teachers: Can only view/edit their own profile
create policy "Teachers can view own profile" on teachers for
select using (auth.uid () = id);

create policy "Teachers can update own profile" on teachers for
update using (auth.uid () = id);

-- Classes: Teachers only access their own classes
create policy "Teachers manage own classes" on classes for all using (auth.uid () = teacher_id);

-- Students: Accessible if the user is the teacher of the class
create policy "Teachers manage students in their classes" on students for all using (
    exists (
        select 1
        from classes
        where
            id = students.class_id
            and teacher_id = auth.uid ()
    )
);

-- Sessions: Accessible via class ownership
create policy "Teachers manage sessions" on attendance_sessions for all using (
    exists (
        select 1
        from classes
        where
            id = attendance_sessions.class_id
            and teacher_id = auth.uid ()
    )
);

-- Records: Accessible via session -> class -> teacher
create policy "Teachers manage records" on attendance_records for all using (
    exists (
        select 1
        from
            attendance_sessions s
            join classes c on s.class_id = c.id
        where
            s.id = attendance_records.session_id
            and c.teacher_id = auth.uid ()
    )
);