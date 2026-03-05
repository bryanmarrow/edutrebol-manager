-- Migration: Introduce school-wide groups
-- Run this in the Supabase SQL editor

-- 1. Create school-wide groups table
CREATE TABLE groups (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  grade integer NOT NULL CHECK (grade IN (1,2,3)),
  section text NOT NULL,
  school_year text NOT NULL DEFAULT '2025-2026',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(grade, section, school_year)
);

-- 2. Add group_id FK to classes (nullable during migration)
ALTER TABLE classes ADD COLUMN group_id uuid REFERENCES groups(id) ON DELETE SET NULL;

-- 3. Add group_id FK to students (nullable during migration)
ALTER TABLE students ADD COLUMN group_id uuid REFERENCES groups(id) ON DELETE CASCADE;

-- 4. Migrate: create groups from distinct (grade, section) combos in existing classes
INSERT INTO groups (grade, section)
  SELECT DISTINCT grade, section FROM classes
  ON CONFLICT (grade, section, school_year) DO NOTHING;

-- 5. Migrate: link existing classes to their newly created group
UPDATE classes c SET group_id = g.id
  FROM groups g
  WHERE g.grade = c.grade AND g.section = c.section;

-- 6. Migrate: link existing students to their class's group
UPDATE students s SET group_id = c.group_id
  FROM classes c
  WHERE s.class_id = c.id AND c.group_id IS NOT NULL;

-- 7. RLS: any authenticated teacher can manage groups (school-wide)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage groups" ON groups
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 8. Update students RLS: all authenticated teachers can access students via groups
DROP POLICY IF EXISTS "Teachers manage students in their classes" ON students;

CREATE POLICY "Teachers can manage students" ON students
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 9. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_group ON students (group_id);
CREATE INDEX IF NOT EXISTS idx_classes_group ON classes (group_id);
