# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Asistencia Secu** is a mobile-first PWA for school attendance tracking built with Next.js 16 + React 19, Tailwind CSS v4, and Supabase (auth + database). Teachers log in, manage groups and classes, take attendance, and log conduct incidents for students.

## Development Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build (run after changes to verify no type errors)
npm run lint     # Run ESLint
```

Environment variables required (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Architecture

### App Router Structure (`src/app/`)
All pages are client components (`"use client"`) that fetch data directly from Supabase via `src/lib/queries.ts`. No server actions.

| Route | Purpose |
|---|---|
| `/` | Auth redirect (→ `/dashboard` or `/login`) |
| `/login` | Supabase email/password auth |
| `/dashboard` | Today's classes for logged-in teacher |
| `/classes` | Teacher's classes management (CRUD) |
| `/classes/[classId]/students` | Redirects to `/groups/[groupId]` |
| `/classes/[classId]/session/[date]` | Live attendance-taking UI (`date` is `YYYY-MM-DD` or `"today"`) |
| `/groups` | All school groups (school-wide, any teacher can view) |
| `/groups/[groupId]` | Student management for a group (add/edit/delete/bulk import) |
| `/schedule` | Schedule configuration for teacher's classes |
| `/reports` | Conduct reports (log incidents, filter, share by group) |
| `/reports/share/[token]` | Public read-only conduct report page (no auth required) |
| `/profile` | Teacher profile |

### Data Layer (`src/lib/`)
- **`supabase.ts`** — Single Supabase client using `NEXT_PUBLIC_*` env vars
- **`queries.ts`** — All Supabase queries as typed async functions. RLS enforces data access rules.
- **`utils.ts`** — `cn()` (clsx + tailwind-merge) and `formatGrade()` (1→"1ero", 2→"2do", 3→"3ero")
- **`conductReports.ts`** — Constants: `REPORT_TYPE_LABELS`, `REPORT_TYPE_COLORS`, `REPORT_TYPES` array

### Database Schema

```
groups (school-wide)
  └→ students (belong to group, not class)
  └→ conduct_reports → teachers
  └→ report_shares (one share token per group)

teachers → classes (link to group) → attendance_sessions → attendance_records
```

Applied migrations (in order):
1. `src/supabase_schema.sql` — base schema
2. `src/migration_grade_to_integer.sql`
3. `src/migration_grade_section.sql`
4. `src/migration_teacher_insert_policy.sql`
5. `src/migration_groups.sql` — adds `groups` table; `group_id` on classes and students
6. `src/migration_students_class_nullable.sql` — makes `students.class_id` nullable (students now belong to groups)
7. `src/migration_conduct_reports.sql` — adds `conduct_reports`, `report_shares`; RPC `get_shared_group_reports`

**Key schema rules:**
- `grade` is always `integer` (1, 2, 3) — use `formatGrade()` for display
- `classes.schedule` is JSONB array: `[{ days: number[], start_time: "HH:MM", end_time: "HH:MM" }]`
- `schedule.days` uses JS convention: 0=Sunday, 1=Monday … 6=Saturday
- Students belong to `groups`, not to `classes` — `getStudentsByClass` resolves through `class.group_id`
- `attendance_sessions` are unique per `(class_id, date)` — always use `getOrCreateSession()` (handles race condition via error code `23505`)
- `report_shares` has `UNIQUE(group_id)` — one share token per group
- `get_shared_group_reports(p_token)` is a `SECURITY DEFINER` RPC callable by `anon` role (for public share pages)

### Types (`src/types/index.ts`)
`AttendanceStatus`, `Group`, `Student`, `ClassGroup`, `AttendanceSession`, `AttendanceRecord`, `StudentWithStatus`, `ConductReportType`, `ConductReport`.

### Key Patterns

**Groups vs Classes:** Groups (`1ero A`, `2do B`) are school-wide and own students. Classes are teacher-specific subjects (e.g., "Matemáticas I") linked to a group via `group_id`. When creating/editing a class, the teacher picks from all groups.

**Conduct reports flow:**
1. Teacher opens `CreateReportDrawer` → selects group → student → incident type → notes → date
2. `createConductReport()` auto-attaches current teacher's ID
3. `getOrCreateShareToken(groupId)` returns a stable hex token for sharing
4. Public share page calls `supabase.rpc('get_shared_group_reports', { p_token })` — no auth needed

**Attendance state:** `useAttendance(storageKey, initialStudents)` in `src/hooks/useAttendance.ts` manages in-progress attendance with `localStorage` persistence under key `${classId}-${sessionDate}`. Status cycles: `present → absent → late → present`. Call `clearLocalSave()` after persisting to Supabase.

**Bulk student import:** `bulkCreateStudents(groupId, students[])` — the group detail page supports pasting a name list for batch enrollment.

### Shared Components (`src/components/`)
- **`layout/TopBar.tsx`**, **`layout/BottomNav.tsx`** — App shell. Nav: Hoy | Clases | Grupos | Horario | Reportes
- **`ClassCard.tsx`**, **`ClassFormDrawer.tsx`** — Class display and create/edit (group picker inside)
- **`CreateReportDrawer.tsx`** — Bottom sheet for logging conduct incidents
- **`StudentRow.tsx`**, **`AttendanceToggle.tsx`** — Attendance UI primitives
- **`session/SessionHeader.tsx`**, **`session/SessionFooter.tsx`** — Attendance session chrome

## Key Conventions
- All database mutations go through functions in `src/lib/queries.ts`
- New schema changes require a `src/migration_*.sql` file
- UI uses Tailwind v4 with `cn()` for conditional classes
- `sonner` for toasts, `framer-motion` for animations, `lucide-react` for icons
- Mobile-first: safe-area padding, fixed bottom nav, bottom-sheet drawers (`fixed bottom-0`)
- `<Toaster>` is in the root layout — don't add it to individual pages
