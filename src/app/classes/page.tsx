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
                                group={`${cls.grade} ${cls.section}`}
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
