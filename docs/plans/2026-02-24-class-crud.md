# Class CRUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a complete CRUD interface to `/classes` so teachers can create, edit, and delete their classes (including schedule) directly from the app.

**Architecture:** A reusable `ClassFormDrawer` bottom drawer handles both create and edit modes (determined by `classData?` prop). The `/classes` page gains a toolbar with `+ Nueva Clase` button and manages drawer state. `ClassCard` gets inline edit/delete buttons. Three new Supabase query functions power the mutations.

**Tech Stack:** Next.js 14 App Router, React 19, TypeScript 5, Tailwind CSS 4, Supabase JS client, Lucide React icons, Sonner toasts.

---

## Task 1: Add class mutation functions to queries.ts

**Files:**
- Modify: `src/lib/queries.ts`

### Step 1: Add `createClass` after the existing `updateClassSchedule` function (line ~70)

Open `src/lib/queries.ts` and insert after `updateClassSchedule`:

```typescript
export async function createClass(data: {
    name: string;
    group_name: string;
    schedule: { days: number[]; start_time: string; end_time: string };
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data: created, error } = await supabase
        .from('classes')
        .insert({ ...data, teacher_id: user.id })
        .select()
        .single();

    if (error) {
        console.error('Error creating class:', error.message);
        throw error;
    }

    return created;
}

export async function updateClass(classId: string, data: {
    name: string;
    group_name: string;
    schedule: { days: number[]; start_time: string; end_time: string };
}) {
    const { error } = await supabase
        .from('classes')
        .update(data)
        .eq('id', classId);

    if (error) {
        console.error('Error updating class:', error.message);
        throw error;
    }

    return true;
}

export async function deleteClass(classId: string) {
    const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

    if (error) {
        console.error('Error deleting class:', error.message);
        throw error;
    }

    return true;
}
```

### Step 2: Verify TypeScript compiles

Run: `npx tsc --noEmit`
Expected: No errors.

### Step 3: Commit

```bash
git add src/lib/queries.ts
git commit -m "feat: add createClass, updateClass, deleteClass query functions"
```

---

## Task 2: Create ClassFormDrawer component

**Files:**
- Create: `src/components/ClassFormDrawer.tsx`

### Step 1: Create the component

Create `src/components/ClassFormDrawer.tsx` with the following content:

```tsx
"use client";

import { useState, useEffect } from "react";
import { X, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { createClass, updateClass } from "@/lib/queries";
import type { ClassGroup } from "@/types";

interface ClassFormDrawerProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    classData?: ClassGroup | null; // null/undefined = create mode, object = edit mode
}

const DAYS = [
    { value: 1, label: "L" },
    { value: 2, label: "M" },
    { value: 3, label: "X" },
    { value: 4, label: "J" },
    { value: 5, label: "V" },
    { value: 6, label: "S" },
    { value: 0, label: "D" },
];

export function ClassFormDrawer({ open, onClose, onSaved, classData }: ClassFormDrawerProps) {
    const isEdit = !!classData;

    const [name, setName] = useState("");
    const [groupName, setGroupName] = useState("");
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [startTime, setStartTime] = useState("08:00");
    const [endTime, setEndTime] = useState("09:00");
    const [saving, setSaving] = useState(false);

    // Pre-fill form when editing
    useEffect(() => {
        if (classData) {
            setName(classData.name);
            setGroupName(classData.group_name);
            setSelectedDays(classData.schedule?.days || []);
            setStartTime(classData.schedule?.start_time || "08:00");
            setEndTime(classData.schedule?.end_time || "09:00");
        } else {
            setName("");
            setGroupName("");
            setSelectedDays([]);
            setStartTime("08:00");
            setEndTime("09:00");
        }
    }, [classData, open]);

    function toggleDay(day: number) {
        setSelectedDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!name.trim() || !groupName.trim()) {
            toast.error("Nombre y grupo son requeridos");
            return;
        }
        if (selectedDays.length === 0) {
            toast.error("Selecciona al menos un día");
            return;
        }

        setSaving(true);
        try {
            const schedule = { days: selectedDays, start_time: startTime, end_time: endTime };

            if (isEdit && classData) {
                await updateClass(classData.id, { name: name.trim(), group_name: groupName.trim(), schedule });
                toast.success("Clase actualizada");
            } else {
                await createClass({ name: name.trim(), group_name: groupName.trim(), schedule });
                toast.success("Clase creada");
            }

            onSaved();
            onClose();
        } catch {
            toast.error("Error al guardar la clase");
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <BookOpen size={18} className="text-indigo-600" />
                        <h2 className="text-base font-semibold text-slate-900">
                            {isEdit ? "Editar clase" : "Nueva clase"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Class name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                            Nombre de la clase
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ej. Matemáticas I"
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    {/* Group name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                            Grupo
                        </label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="ej. 1° A"
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    {/* Days selector */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            Días
                        </label>
                        <div className="flex gap-2">
                            {DAYS.map((day) => (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleDay(day.value)}
                                    className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors ${
                                        selectedDays.includes(day.value)
                                            ? "bg-indigo-600 text-white"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                Hora inicio
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                Hora fin
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
                    >
                        {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear clase"}
                    </button>
                </form>
            </div>
        </>
    );
}
```

### Step 2: Verify TypeScript compiles

Run: `npx tsc --noEmit`
Expected: No errors.

### Step 3: Commit

```bash
git add src/components/ClassFormDrawer.tsx
git commit -m "feat: add ClassFormDrawer component for create/edit classes"
```

---

## Task 3: Update ClassCard to support edit and delete

**Files:**
- Modify: `src/components/ClassCard.tsx`

### Step 1: Replace the component

The current `ClassCard` doesn't accept `onEdit`/`onDelete` callbacks. Replace the entire file with:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, ChevronRight, Users, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassCardProps {
    id: string;
    name: string;
    group: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'completed' | 'upcoming';
    studentCount: number;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function ClassCard({ id, name, group, startTime, endTime, status, studentCount, onEdit, onDelete }: ClassCardProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    const statusStyles = {
        pending: "border-l-4 border-indigo-500 bg-white",
        completed: "border-l-4 border-emerald-500 bg-slate-50 opacity-75",
        upcoming: "border-l-4 border-slate-300 bg-white opacity-90",
    };

    return (
        <div className={cn(
            "rounded-lg shadow-sm border border-slate-100 overflow-hidden",
            statusStyles[status]
        )}>
            {/* Main area — links to attendance */}
            <Link href={`/classes/${id}/session/today`} className="block p-4 transition-transform active:scale-[0.98]">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {group}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock size={12} /> {startTime} - {endTime}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{name}</h3>
                        <p className="text-sm text-slate-500">{studentCount} Alumnos</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {status === 'completed' && (
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                Listado
                            </span>
                        )}
                        {status === 'pending' && (
                            <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <ChevronRight size={20} />
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Bottom action bar */}
            <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between">
                <Link
                    href={`/classes/${id}/students`}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                >
                    <Users size={14} />
                    Editar alumnos
                </Link>

                <div className="flex items-center gap-1">
                    {/* Edit button */}
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Editar clase"
                        >
                            <Pencil size={14} />
                        </button>
                    )}

                    {/* Delete — inline confirm */}
                    {onDelete && !confirmDelete && (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar clase"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}

                    {confirmDelete && (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-rose-600 font-medium">¿Eliminar?</span>
                            <button
                                onClick={() => { onDelete?.(); setConfirmDelete(false); }}
                                className="text-xs px-2 py-1 bg-rose-600 text-white rounded font-medium"
                            >
                                Sí
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded font-medium"
                            >
                                No
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
```

### Step 2: Verify TypeScript compiles

Run: `npx tsc --noEmit`
Expected: No errors.

### Step 3: Commit

```bash
git add src/components/ClassCard.tsx
git commit -m "feat: add edit and delete actions to ClassCard"
```

---

## Task 4: Update the /classes page with toolbar and drawer state

**Files:**
- Modify: `src/app/classes/page.tsx`

### Step 1: Replace the entire page

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { ClassCard } from "@/components/ClassCard";
import { ClassFormDrawer } from "@/components/ClassFormDrawer";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { getTeacherClasses, deleteClass } from "@/lib/queries";
import { toast } from "sonner";
import type { ClassGroup } from "@/types";

export default function ClassesPage() {
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);

    const loadClasses = useCallback(async () => {
        setLoading(true);
        const data = await getTeacherClasses();
        setClasses(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadClasses();
    }, [loadClasses]);

    function handleNewClass() {
        setEditingClass(null);
        setDrawerOpen(true);
    }

    function handleEditClass(cls: ClassGroup) {
        setEditingClass(cls);
        setDrawerOpen(true);
    }

    async function handleDeleteClass(classId: string) {
        try {
            await deleteClass(classId);
            toast.success("Clase eliminada");
            loadClasses();
        } catch {
            toast.error("Error al eliminar la clase");
        }
    }

    function handleDrawerClose() {
        setDrawerOpen(false);
        setEditingClass(null);
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-28">
            <TopBar title="Mis Grupos" />

            {/* Toolbar */}
            <div className="px-4 pt-4 pb-2">
                <button
                    onClick={handleNewClass}
                    className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm active:scale-[0.98] transition-transform shadow-sm"
                >
                    <Plus size={16} />
                    Nueva clase
                </button>
            </div>

            <main className="p-4 space-y-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-white rounded-lg animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : classes.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg border border-slate-100 text-center">
                        <p className="text-slate-500 mb-1">No hay grupos registrados.</p>
                        <p className="text-xs text-slate-400">Usa el botón de arriba para crear tu primera clase.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {classes.map((cls) => (
                            <ClassCard
                                key={cls.id}
                                id={cls.id}
                                name={cls.name}
                                group={cls.group_name}
                                startTime={cls.schedule?.start_time || "--:--"}
                                endTime={cls.schedule?.end_time || "--:--"}
                                status="upcoming"
                                studentCount={cls.student_count || 0}
                                onEdit={() => handleEditClass(cls)}
                                onDelete={() => handleDeleteClass(cls.id)}
                            />
                        ))}
                    </div>
                )}
            </main>

            <ClassFormDrawer
                open={drawerOpen}
                onClose={handleDrawerClose}
                onSaved={loadClasses}
                classData={editingClass}
            />

            <BottomNav />
        </div>
    );
}
```

### Step 2: Verify TypeScript compiles

Run: `npx tsc --noEmit`
Expected: No errors.

### Step 3: Start dev server and test manually

Run: `npm run dev`

Verify:
- [ ] `/classes` shows "Nueva clase" toolbar button
- [ ] Clicking button opens bottom drawer with empty form
- [ ] Filling form and clicking "Crear clase" creates a new class and it appears in the list
- [ ] Clicking pencil icon on a class opens drawer pre-filled with that class's data
- [ ] Editing and saving updates the class in the list
- [ ] Clicking trash icon shows "¿Eliminar? Sí / No" inline confirmation
- [ ] Confirming delete removes the class from the list
- [ ] Cancelling delete returns to normal state
- [ ] Empty state message shows hint about using the button

### Step 4: Commit

```bash
git add src/app/classes/page.tsx
git commit -m "feat: add class management toolbar and drawer to /classes page"
```

---

## Task 5: Save memory notes

**Files:**
- Create/update: `/Users/bryanmartinez/.claude/projects/-Users-bryanmartinez-Documents-Desarrollo-IA-panel-secu-asistencia-secu/memory/MEMORY.md`

Add project notes about the new components and patterns used.

---

## Verification Checklist

After all tasks are complete, run a final check:

```bash
npx tsc --noEmit
npm run build
```

Expected: Zero TypeScript errors, successful production build.
