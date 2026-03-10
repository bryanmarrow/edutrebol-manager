# Student Profile — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear la página `/students/[studentId]` que consolida asistencia acumulada (métricas globales + gráfica de tendencia 8 semanas + desglose por materia) y bitácora de conducta (totales por tipo + lista), con botón para crear reporte directamente desde el perfil.

**Architecture:** Página "use client" que hace 4 fetches en paralelo (info del alumno, stats de asistencia, tendencia semanal, desglose por materia, reportes de conducta). Los datos se calculan client-side sobre las tablas existentes sin SQL nuevo. Los componentes son presentacionales puros — reciben props y no hacen fetches propios.

**Tech Stack:** Next.js 16 App Router ("use client"), Tailwind v4, Supabase JS client, recharts (nueva dep), lucide-react, sonner toasts.

---

## Chunk 1: Infraestructura — queries + dependencia recharts

### Task 1: Instalar recharts

**Files:**
- Modify: `package.json` (npm install)

- [ ] **Step 1: Instalar recharts**

```bash
npm install recharts
```

- [ ] **Step 2: Verificar que el build pasa**

```bash
npm run build
```

Expected: Build exitoso sin errores de tipos.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: agregar recharts para gráficas de asistencia"
```

---

### Task 2: Agregar `getStudentById` a queries.ts

**Files:**
- Modify: `src/lib/queries.ts`

El alumno ya tiene `group_id`. Necesitamos también `groups(grade, section)` para el badge del perfil.

- [ ] **Step 1: Agregar la función al final de la sección STUDENTS en queries.ts**

Busca el comentario `// ============================================================` que precede a `// ATTENDANCE SESSIONS` y agrega antes de él:

```ts
export async function getStudentById(studentId: string): Promise<{
    id: string;
    first_name: string;
    last_name: string;
    student_id_official?: string;
    group_id?: string;
    group_grade?: number;
    group_section?: string;
} | null> {
    const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_id_official, group_id, groups(grade, section)')
        .eq('id', studentId)
        .single();

    if (error) {
        console.error('Error fetching student:', error.message);
        return null;
    }

    return {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        student_id_official: data.student_id_official,
        group_id: data.group_id,
        group_grade: (data as any).groups?.grade,
        group_section: (data as any).groups?.section,
    };
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Expected: Sin errores de tipos.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries.ts
git commit -m "feat(queries): agregar getStudentById con datos del grupo"
```

---

### Task 3: Agregar filtro `student_id` a `getConductReports`

**Files:**
- Modify: `src/lib/queries.ts`

- [ ] **Step 1: Agregar `student_id` al tipo de filtros de `getConductReports`**

Encuentra:
```ts
export async function getConductReports(filters?: {
    group_id?: string;
    type?: ConductReportType;
    from?: string;
    to?: string;
}): Promise<ConductReport[]> {
```

Reemplaza con:
```ts
export async function getConductReports(filters?: {
    group_id?: string;
    student_id?: string;
    type?: ConductReportType;
    from?: string;
    to?: string;
}): Promise<ConductReport[]> {
```

- [ ] **Step 2: Aplicar el filtro en la query**

Encuentra el bloque de filtros dentro de la función (después del `let query = supabase...`):
```ts
    if (filters?.group_id) query = query.eq('group_id', filters.group_id);
    if (filters?.type) query = query.eq('type', filters.type);
```

Agrega después de `group_id`:
```ts
    if (filters?.student_id) query = query.eq('student_id', filters.student_id);
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/queries.ts
git commit -m "feat(queries): agregar filtro student_id a getConductReports"
```

---

### Task 4: Agregar funciones de asistencia del alumno

**Files:**
- Modify: `src/lib/queries.ts`

Agrega estas 3 funciones al final del archivo (antes del cierre). Los datos se calculan en JS sobre los registros crudos de Supabase.

- [ ] **Step 1: Agregar helpers de semana y las 3 funciones**

Al final de `src/lib/queries.ts`, antes del último salto de línea:

```ts
// ============================================================
// STUDENT ATTENDANCE STATS
// ============================================================

/** Devuelve la semana ISO (lunes) en formato YYYY-MM-DD */
function getWeekStart(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
}

/** Estadísticas globales de asistencia del alumno en el ciclo */
export async function getStudentAttendanceStats(studentId: string): Promise<{
    totalSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    percentPresent: number;
}> {
    const { data, error } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('student_id', studentId);

    if (error || !data) return { totalSessions: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0, percentPresent: 0 };

    const totalSessions = data.length;
    const totalPresent = data.filter((r: any) => r.status === 'present').length;
    const totalAbsent = data.filter((r: any) => r.status === 'absent').length;
    const totalLate = data.filter((r: any) => r.status === 'late').length;
    const percentPresent = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

    return { totalSessions, totalPresent, totalAbsent, totalLate, percentPresent };
}

/** Agregado semanal de asistencia — últimas N semanas (default 8) */
export async function getStudentAttendanceTrend(
    studentId: string,
    weeks = 8
): Promise<{ weekLabel: string; present: number; absent: number; late: number }[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('attendance_records')
        .select('status, attendance_sessions(date)')
        .eq('student_id', studentId);

    if (error || !data) return [];

    // Filter to last N weeks in JS
    const filtered = data.filter((r: any) => {
        const date = r.attendance_sessions?.date;
        return date && date >= cutoffStr;
    });

    // Group by week start
    const map = new Map<string, { present: number; absent: number; late: number }>();
    for (const r of filtered) {
        const date = (r as any).attendance_sessions?.date;
        if (!date) continue;
        const week = getWeekStart(date);
        if (!map.has(week)) map.set(week, { present: 0, absent: 0, late: 0 });
        const entry = map.get(week)!;
        if (r.status === 'present') entry.present++;
        else if (r.status === 'absent') entry.absent++;
        else if (r.status === 'late') entry.late++;
    }

    // Fill missing weeks with zeros
    const result: { weekLabel: string; present: number; absent: number; late: number }[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i * 7);
        const week = getWeekStart(d.toISOString().split('T')[0]);
        const label = new Date(week + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
        const entry = map.get(week) ?? { present: 0, absent: 0, late: 0 };
        result.push({ weekLabel: label, ...entry });
    }

    return result;
}

/** Desglose de asistencia por materia/clase */
export async function getStudentAttendanceByClass(studentId: string): Promise<{
    classId: string;
    className: string;
    totalSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    percentPresent: number;
}[]> {
    const { data, error } = await supabase
        .from('attendance_records')
        .select('status, attendance_sessions(class_id, classes(id, name))')
        .eq('student_id', studentId);

    if (error || !data) return [];

    const map = new Map<string, {
        classId: string; className: string;
        present: number; absent: number; late: number; total: number;
    }>();

    for (const r of data) {
        const session = (r as any).attendance_sessions;
        const cls = session?.classes;
        if (!cls?.id) continue;
        if (!map.has(cls.id)) {
            map.set(cls.id, { classId: cls.id, className: cls.name ?? 'Sin nombre', present: 0, absent: 0, late: 0, total: 0 });
        }
        const entry = map.get(cls.id)!;
        entry.total++;
        if (r.status === 'present') entry.present++;
        else if (r.status === 'absent') entry.absent++;
        else if (r.status === 'late') entry.late++;
    }

    return Array.from(map.values()).map((e) => ({
        classId: e.classId,
        className: e.className,
        totalSessions: e.total,
        totalPresent: e.present,
        totalAbsent: e.absent,
        totalLate: e.late,
        percentPresent: e.total > 0 ? Math.round((e.present / e.total) * 100) : 0,
    })).sort((a, b) => a.className.localeCompare(b.className));
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Expected: Sin errores de tipos.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries.ts
git commit -m "feat(queries): agregar estadísticas de asistencia por alumno"
```

---

### Task 5: Extender `CreateReportDrawer` con `preselectedStudentId`

El drawer ya soporta `preselectedGroupId`. Hay que agregar `preselectedStudentId` para que el perfil del alumno lo abra pre-cargado.

**Files:**
- Modify: `src/components/CreateReportDrawer.tsx`

- [ ] **Step 1: Agregar prop `preselectedStudentId` a la interfaz**

Encuentra:
```ts
interface CreateReportDrawerProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    preselectedGroupId?: string;
}
```

Reemplaza con:
```ts
interface CreateReportDrawerProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    preselectedGroupId?: string;
    preselectedStudentId?: string;
}
```

- [ ] **Step 2: Recibir la prop en la función**

Encuentra:
```ts
export function CreateReportDrawer({ open, onClose, onSaved, preselectedGroupId }: CreateReportDrawerProps) {
```

Reemplaza con:
```ts
export function CreateReportDrawer({ open, onClose, onSaved, preselectedGroupId, preselectedStudentId }: CreateReportDrawerProps) {
```

- [ ] **Step 3: Inicializar `selectedStudentId` con el valor preseleccionado**

Encuentra el `useEffect` que corre al abrir el drawer:
```ts
    useEffect(() => {
        if (!open) return;
        getAllGroups().then(setGroups);
        setSelectedGroupId(preselectedGroupId ?? "");
        setSelectedStudentId("");
        setStudentSearch("");
        setSelectedType("");
        setNotes("");
        setDate(today());
    }, [open, preselectedGroupId]);
```

Reemplaza con:
```ts
    useEffect(() => {
        if (!open) return;
        getAllGroups().then(setGroups);
        setSelectedGroupId(preselectedGroupId ?? "");
        setSelectedStudentId(preselectedStudentId ?? "");
        setStudentSearch("");
        setSelectedType("");
        setNotes("");
        setDate(today());
    }, [open, preselectedGroupId, preselectedStudentId]);
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/CreateReportDrawer.tsx
git commit -m "feat(drawer): soporte para preselectedStudentId en CreateReportDrawer"
```

---

## Chunk 2: Componentes UI del perfil

### Task 6: Crear `AttendanceStats`

**Files:**
- Create: `src/components/students/AttendanceStats.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
// src/components/students/AttendanceStats.tsx
interface Props {
    totalSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    percentPresent: number;
}

export function AttendanceStats({ totalSessions, totalPresent, totalAbsent, totalLate, percentPresent }: Props) {
    const color = percentPresent >= 85 ? 'text-emerald-600' : percentPresent >= 70 ? 'text-amber-600' : 'text-rose-600';
    const bg = percentPresent >= 85 ? 'bg-emerald-50 border-emerald-200' : percentPresent >= 70 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';

    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {/* % Global */}
            <div className={`rounded-xl border px-4 py-3 ${bg}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-0.5">Asistencia</p>
                <p className={`text-2xl font-bold ${color}`}>{percentPresent}%</p>
                <p className="text-[10px] text-[#8E8E8E]">{totalSessions} sesiones</p>
            </div>

            {/* Presentes */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-0.5">Presentes</p>
                <p className="text-2xl font-bold text-[#181818]">{totalPresent}</p>
                <p className="text-[10px] text-[#8E8E8E]">de {totalSessions}</p>
            </div>

            {/* Faltas */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-0.5">Faltas</p>
                <p className="text-2xl font-bold text-rose-600">{totalAbsent}</p>
                <p className="text-[10px] text-[#8E8E8E]">ausencias</p>
            </div>

            {/* Tardanzas */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-0.5">Tardanzas</p>
                <p className="text-2xl font-bold text-amber-600">{totalLate}</p>
                <p className="text-[10px] text-[#8E8E8E]">retardos</p>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/students/AttendanceStats.tsx
git commit -m "feat(students): componente AttendanceStats"
```

---

### Task 7: Crear `AttendanceTrend`

**Files:**
- Create: `src/components/students/AttendanceTrend.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
// src/components/students/AttendanceTrend.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface WeekData {
    weekLabel: string;
    present: number;
    absent: number;
    late: number;
}

interface Props {
    data: WeekData[];
}

export function AttendanceTrend({ data }: Props) {
    const hasData = data.some((w) => w.present + w.absent + w.late > 0);

    if (!hasData) {
        return (
            <div className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-8 text-center">
                <p className="text-sm text-[#8E8E8E]">Sin datos de asistencia registrados</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-3">
                Tendencia — últimas 8 semanas
            </p>
            <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data} barSize={8} barCategoryGap="30%">
                    <XAxis
                        dataKey="weekLabel"
                        tick={{ fontSize: 9, fill: '#8E8E8E' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E0E0E0' }}
                        labelStyle={{ fontWeight: 600, color: '#181818' }}
                    />
                    <Legend
                        iconType="circle"
                        iconSize={7}
                        wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                        formatter={(value) =>
                            value === 'present' ? 'Presente' : value === 'absent' ? 'Falta' : 'Tardanza'
                        }
                    />
                    <Bar dataKey="present" name="present" stackId="a" fill="#BBF451" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="late" name="late" stackId="a" fill="#FCD34D" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="absent" name="absent" stackId="a" fill="#FB7185" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Expected: Sin errores. recharts ya fue instalado en Task 1.

- [ ] **Step 3: Commit**

```bash
git add src/components/students/AttendanceTrend.tsx
git commit -m "feat(students): componente AttendanceTrend con recharts"
```

---

### Task 8: Crear `AttendanceByClass`

**Files:**
- Create: `src/components/students/AttendanceByClass.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
// src/components/students/AttendanceByClass.tsx
interface ClassStat {
    classId: string;
    className: string;
    totalSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    percentPresent: number;
}

interface Props {
    data: ClassStat[];
}

export function AttendanceByClass({ data }: Props) {
    if (data.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-6 text-center">
                <p className="text-sm text-[#8E8E8E]">Sin materias registradas</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F0F0F0]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E]">
                    Desglose por materia
                </p>
            </div>
            <div className="divide-y divide-[#F5F5F5]">
                {data.map((cls) => {
                    const color = cls.percentPresent >= 85
                        ? 'text-emerald-600'
                        : cls.percentPresent >= 70
                        ? 'text-amber-600'
                        : 'text-rose-600';

                    const barColor = cls.percentPresent >= 85
                        ? 'bg-emerald-400'
                        : cls.percentPresent >= 70
                        ? 'bg-amber-400'
                        : 'bg-rose-400';

                    return (
                        <div key={cls.classId} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-1.5">
                                <p className="text-sm font-medium text-[#181818] truncate mr-2">{cls.className}</p>
                                <span className={`text-sm font-bold shrink-0 ${color}`}>{cls.percentPresent}%</span>
                            </div>
                            {/* Progress bar */}
                            <div className="h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${barColor}`}
                                    style={{ width: `${cls.percentPresent}%` }}
                                />
                            </div>
                            <div className="flex gap-3 mt-1 text-[10px] text-[#8E8E8E]">
                                <span>{cls.totalSessions} sesiones</span>
                                <span>· {cls.totalAbsent} faltas</span>
                                {cls.totalLate > 0 && <span>· {cls.totalLate} tardanzas</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/students/AttendanceByClass.tsx
git commit -m "feat(students): componente AttendanceByClass"
```

---

### Task 9: Crear `ConductSummary`

**Files:**
- Create: `src/components/students/ConductSummary.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
// src/components/students/ConductSummary.tsx
import { ClipboardList } from "lucide-react";
import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS, REPORT_TYPES } from "@/lib/conductReports";
import type { ConductReport } from "@/types";

interface Props {
    reports: ConductReport[];
}

function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

export function ConductSummary({ reports }: Props) {
    // Count by type
    const countByType: Record<string, number> = {};
    for (const r of reports) {
        countByType[r.type] = (countByType[r.type] ?? 0) + 1;
    }

    return (
        <div className="space-y-3">
            {/* Header + pills */}
            <div className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E]">
                        Conducta
                    </p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        reports.length >= 5 ? 'bg-rose-100 text-rose-700'
                        : reports.length >= 3 ? 'bg-amber-100 text-amber-700'
                        : 'bg-[#F0F0F0] text-[#8E8E8E]'
                    }`}>
                        {reports.length} reporte{reports.length !== 1 ? 's' : ''}
                    </span>
                </div>
                {reports.length === 0 ? (
                    <p className="text-sm text-[#8E8E8E]">Sin reportes de conducta</p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {REPORT_TYPES.filter((t) => countByType[t]).map((t) => (
                            <span key={t} className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${REPORT_TYPE_COLORS[t]}`}>
                                {countByType[t]} {REPORT_TYPE_LABELS[t]}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Chronological list */}
            {reports.length > 0 && (
                <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
                    <div className="divide-y divide-[#F5F5F5]">
                        {reports.map((r) => (
                            <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                                <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${REPORT_TYPE_COLORS[r.type]}`}>
                                    {REPORT_TYPE_LABELS[r.type]}
                                </span>
                                <div className="flex-1 min-w-0">
                                    {r.notes && (
                                        <p className="text-xs text-[#181818] mb-0.5">{r.notes}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-[10px] text-[#8E8E8E]">
                                        <span>{formatDate(r.date)}</span>
                                        <span>· {r.teacher_name}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/students/ConductSummary.tsx
git commit -m "feat(students): componente ConductSummary"
```

---

## Chunk 3: Página principal + entry points

### Task 10: Crear la página `/students/[studentId]/page.tsx`

**Files:**
- Create: `src/app/students/[studentId]/page.tsx`

- [ ] **Step 1: Crear el directorio**

```bash
mkdir -p src/app/students/\[studentId\]
```

- [ ] **Step 2: Crear la página**

```tsx
// src/app/students/[studentId]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/layout/BottomNav";
import { CreateReportDrawer } from "@/components/CreateReportDrawer";
import { AttendanceStats } from "@/components/students/AttendanceStats";
import { AttendanceTrend } from "@/components/students/AttendanceTrend";
import { AttendanceByClass } from "@/components/students/AttendanceByClass";
import { ConductSummary } from "@/components/students/ConductSummary";
import {
    getStudentById,
    getStudentAttendanceStats,
    getStudentAttendanceTrend,
    getStudentAttendanceByClass,
    getConductReports,
} from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import type { ConductReport } from "@/types";

export default function StudentProfilePage() {
    const { studentId } = useParams<{ studentId: string }>();
    const router = useRouter();

    const [student, setStudent] = useState<Awaited<ReturnType<typeof getStudentById>>>(null);
    const [stats, setStats] = useState<Awaited<ReturnType<typeof getStudentAttendanceStats>> | null>(null);
    const [trend, setTrend] = useState<Awaited<ReturnType<typeof getStudentAttendanceTrend>>>([]);
    const [byClass, setByClass] = useState<Awaited<ReturnType<typeof getStudentAttendanceByClass>>>([]);
    const [reports, setReports] = useState<ConductReport[]>([]);
    const [loading, setLoading] = useState(true);

    const [drawerOpen, setDrawerOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        const [s, st, tr, bc, rp] = await Promise.all([
            getStudentById(studentId),
            getStudentAttendanceStats(studentId),
            getStudentAttendanceTrend(studentId),
            getStudentAttendanceByClass(studentId),
            getConductReports({ student_id: studentId }),
        ]);
        setStudent(s);
        setStats(st);
        setTrend(tr);
        setByClass(bc);
        setReports(rp);
        setLoading(false);
    }, [studentId]);

    useEffect(() => { loadData(); }, [loadData]);

    const studentName = student
        ? `${student.last_name} ${student.first_name}`
        : 'Alumno';

    const groupBadge = student?.group_grade && student?.group_section
        ? `${formatGrade(student.group_grade)} ${student.group_section}`
        : null;

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-28">
            {/* TopBar */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#E0E0E0] px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="p-1.5 -ml-1 rounded-lg text-[#181818] hover:bg-[#F5F5F5] transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-base font-bold text-[#181818] truncate">{studentName}</h1>
                    {groupBadge && (
                        <p className="text-xs text-[#8E8E8E]">{groupBadge}</p>
                    )}
                </div>
            </div>

            <main className="px-4 py-4 space-y-4 max-w-5xl mx-auto">
                {loading ? (
                    <>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {[1,2,3,4].map((i) => (
                                <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-[#E0E0E0]" />
                            ))}
                        </div>
                        <div className="h-48 bg-white rounded-xl animate-pulse border border-[#E0E0E0]" />
                        <div className="h-32 bg-white rounded-xl animate-pulse border border-[#E0E0E0]" />
                        <div className="h-24 bg-white rounded-xl animate-pulse border border-[#E0E0E0]" />
                    </>
                ) : (
                    <>
                        {/* Asistencia */}
                        <div>
                            <p className="text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">Asistencia</p>
                            {stats && (
                                <div className="space-y-3">
                                    <AttendanceStats {...stats} />
                                    <AttendanceTrend data={trend} />
                                    <AttendanceByClass data={byClass} />
                                </div>
                            )}
                        </div>

                        {/* Conducta */}
                        <div>
                            <p className="text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">Conducta</p>
                            <ConductSummary reports={reports} />
                        </div>
                    </>
                )}
            </main>

            {/* FAB — crear reporte */}
            <button
                onClick={() => setDrawerOpen(true)}
                className="fixed bottom-24 right-4 z-20 w-14 h-14 rounded-full bg-[#181818] text-white shadow-lg flex items-center justify-center hover:bg-[#333] active:scale-95 transition-all"
                title="Nuevo reporte de conducta"
            >
                <ClipboardList size={22} />
            </button>

            <BottomNav />

            <CreateReportDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSaved={() => {
                    setDrawerOpen(false);
                    toast.success("Reporte guardado");
                    loadData();
                }}
                preselectedGroupId={student?.group_id}
                preselectedStudentId={studentId}
            />
        </div>
    );
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Expected: Sin errores. La página compila correctamente.

- [ ] **Step 4: Verificar en el browser**

Navega directamente a `/students/<uuid-de-alumno-real>` y verifica:
- El nombre y badge del grupo aparecen en el TopBar
- Las tarjetas de stats muestran 0 o datos reales según el alumno
- La gráfica de tendencia se renderiza (aunque muestre ceros si no hay datos)
- El FAB (+) abre el drawer pre-cargado con el grupo del alumno

- [ ] **Step 5: Commit**

```bash
git add src/app/students/
git commit -m "feat: página de perfil del alumno /students/[studentId]"
```

---

### Task 11: Agregar link desde la vista de grupo

**Files:**
- Modify: `src/app/groups/[groupId]/page.tsx`

Actualmente el nombre del alumno es texto plano dentro de un `<div>`. Lo convertimos en `<Link>`.

- [ ] **Step 1: Agregar import de Link**

Al inicio del archivo, agrega `Link` al import de next/navigation (o agrega un nuevo import si no existe):

```ts
import Link from "next/link";
```

- [ ] **Step 2: Convertir el nombre del alumno en link**

Encuentra este bloque (dentro del `.map` de `filtered`):
```tsx
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#181818] truncate">
                                        {student.last_name}{" "}
                                        <span className="text-[#8E8E8E] font-normal">{student.first_name}</span>
                                    </p>
                                    {student.student_id_official && (
                                        <p className="text-xs text-[#8E8E8E]">{student.student_id_official}</p>
                                    )}
                                    {!student.active && (
                                        <span className="text-[10px] font-semibold text-red-500 uppercase">Baja</span>
                                    )}
                                </div>
```

Reemplaza con:
```tsx
                                <Link href={`/students/${student.id}`} className="flex-1 min-w-0 group">
                                    <p className="text-sm font-medium text-[#181818] truncate group-hover:text-[#555] transition-colors">
                                        {student.last_name}{" "}
                                        <span className="text-[#8E8E8E] font-normal">{student.first_name}</span>
                                    </p>
                                    {student.student_id_official && (
                                        <p className="text-xs text-[#8E8E8E]">{student.student_id_official}</p>
                                    )}
                                    {!student.active && (
                                        <span className="text-[10px] font-semibold text-red-500 uppercase">Baja</span>
                                    )}
                                </Link>
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

- [ ] **Step 4: Verificar en el browser**

Abre `/groups/<groupId>`, toca un nombre de alumno → debe navegar a `/students/<studentId>`.

- [ ] **Step 5: Commit**

```bash
git add src/app/groups/[groupId]/page.tsx
git commit -m "feat(groups): nombre de alumno navega al perfil"
```

---

### Task 12: Agregar link desde la vista de reportes por grupo

**Files:**
- Modify: `src/app/reports/group/[groupId]/page.tsx`

Actualmente el nombre del alumno en las tarjetas es texto dentro del `<button>` de toggle. Hay que hacerlo navegar al perfil.

- [ ] **Step 1: Agregar import de Link**

```ts
import Link from "next/link";
```

- [ ] **Step 2: Convertir el nombre del alumno en link**

Encuentra (dentro del `.map` de `byStudent`):
```tsx
                                    <button
                                        onClick={() => setExpanded(isExpanded ? null : sg.student_id)}
                                        className="w-full px-4 py-3.5 text-left hover:bg-[#FAFAFA] transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-sm font-bold text-[#181818] truncate">{sg.student_name}</span>
```

Reemplaza solo el `<span>` con el nombre:
```tsx
                                                <Link
                                                    href={`/students/${sg.student_id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-sm font-bold text-[#181818] truncate hover:underline"
                                                >
                                                    {sg.student_name}
                                                </Link>
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

- [ ] **Step 4: Verificar en el browser**

Abre `/reports/group/<groupId>`, toca el nombre de un alumno → navega a `/students/<studentId>`. Tocar el resto de la tarjeta sigue expandiendo/colapsando.

- [ ] **Step 5: Commit**

```bash
git add src/app/reports/group/[groupId]/page.tsx
git commit -m "feat(reports): nombre de alumno navega al perfil desde reporte de grupo"
```

---

## Verificación final

- [ ] **Build limpio**

```bash
npm run build
```

Expected: 0 errores, 0 warnings de tipos.

- [ ] **Flujo completo manual**

1. `/groups/<groupId>` → tocar alumno → llega a perfil
2. Perfil muestra: métricas globales, gráfica de tendencia, desglose por materia, lista de conducta
3. FAB → abre drawer con grupo pre-cargado → crear reporte → perfil se recarga
4. `/reports/group/<groupId>` → tocar nombre de alumno → llega a perfil
5. Botón ← en perfil regresa a la página anterior en ambos casos

- [ ] **Commit final de verificación**

```bash
git add -A
git commit -m "feat: perfil del alumno — asistencia, tendencia y conducta consolidados"
```
