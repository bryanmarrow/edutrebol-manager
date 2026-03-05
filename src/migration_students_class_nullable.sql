-- Migration: Make class_id nullable on students
-- Students now belong to groups, not classes.
-- class_id is kept for backward compatibility but is no longer required.
-- Run this in the Supabase SQL editor.

ALTER TABLE students ALTER COLUMN class_id DROP NOT NULL;
