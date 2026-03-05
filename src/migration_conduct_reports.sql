-- Migration: Conduct Reports (Bitácora)
-- Run this in the Supabase SQL editor

-- 1. Tabla de reportes de conducta
CREATE TABLE conduct_reports (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  teacher_id uuid REFERENCES teachers(id) NOT NULL,
  type text NOT NULL CHECK (type IN ('uniform','late','left_class','homework','other')),
  notes text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Tokens de compartición (uno por grupo, UNIQUE en group_id)
CREATE TABLE report_shares (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL UNIQUE,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by uuid REFERENCES teachers(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. RLS conduct_reports: maestros autenticados pueden todo
ALTER TABLE conduct_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage conduct reports" ON conduct_reports
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. RLS report_shares: maestros autenticados pueden todo; anónimos pueden SELECT
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage shares" ON report_shares
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can read share tokens" ON report_shares
  FOR SELECT
  USING (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_conduct_reports_group ON conduct_reports (group_id);
CREATE INDEX IF NOT EXISTS idx_conduct_reports_student ON conduct_reports (student_id);
CREATE INDEX IF NOT EXISTS idx_conduct_reports_date ON conduct_reports (date DESC);

-- 6. RPC pública SECURITY DEFINER: devuelve reportes de un grupo dado un token válido
CREATE OR REPLACE FUNCTION get_shared_group_reports(p_token text)
RETURNS TABLE (
  id uuid,
  student_first_name text,
  student_last_name text,
  type text,
  notes text,
  date date,
  teacher_name text,
  created_at timestamptz,
  group_grade integer,
  group_section text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  SELECT group_id INTO v_group_id FROM report_shares WHERE token = p_token;
  IF v_group_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      cr.id,
      s.first_name,
      s.last_name,
      cr.type,
      cr.notes,
      cr.date,
      COALESCE(t.full_name, 'Maestro'),
      cr.created_at,
      g.grade,
      g.section
    FROM conduct_reports cr
    JOIN students s ON s.id = cr.student_id
    JOIN teachers t ON t.id = cr.teacher_id
    JOIN groups g ON g.id = cr.group_id
    WHERE cr.group_id = v_group_id
    ORDER BY cr.date DESC, cr.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_shared_group_reports(text) TO anon, authenticated;
