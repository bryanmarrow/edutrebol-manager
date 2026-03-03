# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Asistencia Secu** is a mobile-first PWA for school attendance tracking built with Next.js 16 + React 19, Tailwind CSS v4, and Supabase (auth + database). Teachers log in, manage their classes, and take attendance for each class per day.

## Development Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

Environment variables required (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Architecture

### App Router Structure (`src/app/`)
All pages are client components (`"use client"`) that fetch data directly from Supabase via `src/lib/queries.ts`.

| Route | Purpose |
|---|---|
| `/` | Auth redirect (→ `/dashboard` or `/login`) |
| `/login` | Supabase email/password auth |
| `/dashboard` | Today's classes for logged-in teacher |
| `/classes` | All classes management (CRUD) |
| `/classes/[classId]/students` | Student list for a class |
| `/classes/[classId]/session` | Live attendance-taking UI |
| `/schedule` | Schedule configuration |
| `/reports` | Attendance reports |
| `/profile` | Teacher profile |

### Data Layer (`src/lib/`)
- **`supabase.ts`** — Single Supabase client using `NEXT_PUBLIC_*` env vars
- **`queries.ts`** — All Supabase queries as typed async functions (no server actions). RLS enforces that teachers only access their own data.
- **`utils.ts`** — `cn()` (clsx + tailwind-merge) and `formatGrade()` (1→"1ero", 2→"2do", 3→"3ero")

### Shared Components (`src/components/`)
- **`layout/TopBar.tsx`** and **`layout/BottomNav.tsx`** — App shell used in every authenticated page
- **`ClassCard.tsx`**, **`ClassFormDrawer.tsx`** — Class display and create/edit form
- **`StudentRow.tsx`**, **`AttendanceToggle.tsx`** — Student list and status toggle UI
- **`session/SessionHeader.tsx`**, **`session/SessionFooter.tsx`** — Attendance session UI chrome

### Attendance State (`src/hooks/useAttendance.ts`)
`useAttendance(sessionId, initialStudents)` manages in-progress attendance with `localStorage` persistence under key `attendance_session_<id>`. Status cycles: `present → absent → late → present`. Call `clearLocalSave()` after persisting to Supabase.

### Database Schema (`src/supabase_schema.sql`)
Five tables with full RLS — teachers can only access their own data chain:

```
teachers → classes → students
                  └→ attendance_sessions → attendance_records
```

- `classes.grade` is an `integer` (1, 2, 3), not text — always use `formatGrade()` for display
- `classes.schedule` is JSONB: `{ days: number[], start_time: "HH:MM", end_time: "HH:MM" }`
- `schedule.days` uses JS day convention: 1=Monday … 5=Friday, 0=Sunday
- `attendance_status` enum: `'present' | 'absent' | 'late'`
- Attendance sessions are unique per `(class_id, date)` — use `getOrCreateSession()` to safely get or create

### Types (`src/types/index.ts`)
Central type definitions: `AttendanceStatus`, `Student`, `ClassGroup`, `AttendanceSession`, `AttendanceRecord`, `StudentWithStatus`.

## Key Conventions
- All database mutations go through functions in `src/lib/queries.ts`
- New schema changes require migration SQL files (see `src/migration_*.sql` examples)
- UI uses Tailwind v4 with `cn()` for conditional classes
- `sonner` for toast notifications, `framer-motion` for animations, `lucide-react` for icons
- App is designed for mobile (no zoom, safe-area padding, bottom nav)
