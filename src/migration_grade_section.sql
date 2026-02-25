-- =====================================================
-- MIGRACIÓN: Separar group_name en grade + section
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Agregar columna grade (nullable primero para la migración)
ALTER TABLE classes ADD COLUMN grade text;
ALTER TABLE classes ADD COLUMN section text;

-- 2. Migrar datos existentes: "1° A" → grade="1°", section="A"
UPDATE classes
SET
  grade   = split_part(group_name, ' ', 1),
  section = split_part(group_name, ' ', 2);

-- 3. Hacer NOT NULL después de migrar
ALTER TABLE classes ALTER COLUMN grade SET NOT NULL;
ALTER TABLE classes ALTER COLUMN section SET NOT NULL;

-- 4. Eliminar columna antigua
ALTER TABLE classes DROP COLUMN group_name;
