-- =====================================================
-- MIGRACIÓN: Convertir grade de texto a entero
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =====================================================
-- Convierte "1°" → 1, "2°" → 2, "3°" → 3
ALTER TABLE classes
    ALTER COLUMN grade TYPE integer
    USING regexp_replace(grade, '[^0-9]', '', 'g')::integer;
