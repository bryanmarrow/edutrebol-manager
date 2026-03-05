"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Users, BookOpen, Trash2, ChevronRight, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { getAllGroups, createGroup, deleteGroup } from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import type { Group } from "@/types";
import Link from "next/link";

const SCHOOL_YEAR = "2025-2026";

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // New group form state
    const [newGrade, setNewGrade] = useState<number>(0);
    const [newSection, setNewSection] = useState("");

    const loadGroups = useCallback(async () => {
        setLoading(true);
        const data = await getAllGroups();
        setGroups(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadGroups();
    }, [loadGroups]);

    async function handleCreateGroup(e: React.FormEvent) {
        e.preventDefault();
        if (newGrade === 0 || !newSection.trim()) {
            toast.error("Selecciona grado e ingresa el grupo");
            return;
        }
        setSaving(true);
        try {
            await createGroup({ grade: newGrade, section: newSection.trim().toUpperCase(), school_year: SCHOOL_YEAR });
            toast.success("Grupo creado");
            setDrawerOpen(false);
            setNewGrade(0);
            setNewSection("");
            await loadGroups();
        } catch {
            toast.error("Error al crear grupo");
        }
        setSaving(false);
    }

    async function handleDeleteGroup(groupId: string) {
        try {
            await deleteGroup(groupId);
            toast.success("Grupo eliminado");
            setConfirmDeleteId(null);
            await loadGroups();
        } catch {
            toast.error("Error al eliminar grupo");
        }
    }

    // Group groups by grade
    const byGrade: Record<number, Group[]> = {};
    for (const g of groups) {
        if (!byGrade[g.grade]) byGrade[g.grade] = [];
        byGrade[g.grade].push(g);
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-28">
            <TopBar title="Grupos" />

            <div className="px-4 pt-4 pb-2">
                <button
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl bg-[#BBF451] text-[#181818] font-semibold text-sm active:scale-[0.98] transition-transform shadow-sm"
                >
                    <Plus size={16} />
                    Nuevo grupo
                </button>
            </div>

            <main className="px-4 py-2 space-y-6">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-[#E0E0E0]" />
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-[#E0E0E0] text-center">
                        <GraduationCap size={32} className="mx-auto text-[#8E8E8E] mb-2" />
                        <p className="text-[#8E8E8E] text-sm mb-1">No hay grupos registrados.</p>
                        <p className="text-xs text-[#8E8E8E]">Crea los grupos de la escuela para asignar alumnos y clases.</p>
                    </div>
                ) : (
                    Object.entries(byGrade).sort(([a], [b]) => Number(a) - Number(b)).map(([grade, gradeGroups]) => (
                        <div key={grade}>
                            <h2 className="text-xs font-bold text-[#8E8E8E] uppercase tracking-wider mb-2">
                                {formatGrade(Number(grade))}
                            </h2>
                            <div className="space-y-2">
                                {gradeGroups.map((group) => (
                                    <div
                                        key={group.id}
                                        className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden"
                                    >
                                        <Link
                                            href={`/groups/${group.id}`}
                                            className="flex items-center gap-3 p-4"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-[#BBF451]/20 flex items-center justify-center shrink-0">
                                                <span className="text-sm font-bold text-[#181818]">{group.section}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#181818]">
                                                    {formatGrade(group.grade)} {group.section}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-[#8E8E8E] mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                        <Users size={11} />
                                                        {group.student_count ?? 0} alumnos
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <BookOpen size={11} />
                                                        {group.class_count ?? 0} clases
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-[#8E8E8E] shrink-0" />
                                        </Link>

                                        <div className="border-t border-[#F5F5F5] px-4 py-2 flex items-center justify-between">
                                            <span className="text-xs text-[#8E8E8E]">{group.school_year}</span>
                                            {confirmDeleteId === group.id ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-rose-600 font-medium">¿Eliminar?</span>
                                                    <button
                                                        onClick={() => handleDeleteGroup(group.id)}
                                                        className="text-xs px-2 py-1 bg-rose-600 text-white rounded font-medium"
                                                    >
                                                        Sí
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="text-xs px-2 py-1 bg-[#F5F5F5] text-[#181818] rounded font-medium"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDeleteId(group.id)}
                                                    className="p-1.5 rounded-lg text-[#8E8E8E] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Create group drawer */}
            {drawerOpen && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-[1000]" onClick={() => setDrawerOpen(false)} />
                    <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col max-h-[70dvh] overflow-hidden">
                        <div className="shrink-0 flex justify-center pt-4 pb-2">
                            <div className="w-12 h-1.5 rounded-full bg-[#E0E0E0]" />
                        </div>

                        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#181818]/10 rounded-xl">
                                    <GraduationCap size={20} className="text-[#BBF451]" />
                                </div>
                                <h2 className="text-lg font-bold text-[#181818]">Nuevo grupo</h2>
                            </div>
                        </div>

                        <form onSubmit={handleCreateGroup} className="p-6 space-y-6 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">
                                    Grado
                                </label>
                                <div className="flex gap-3">
                                    {([1, 2, 3] as const).map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setNewGrade(g)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                                                newGrade === g
                                                    ? "bg-[#BBF451] text-[#181818]"
                                                    : "bg-[#F5F5F5] text-[#8E8E8E] hover:bg-[#E0E0E0]"
                                            }`}
                                        >
                                            {g === 1 ? "1ero" : g === 2 ? "2do" : "3ero"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1.5">
                                    Grupo
                                </label>
                                <input
                                    type="text"
                                    value={newSection}
                                    onChange={(e) => setNewSection(e.target.value)}
                                    placeholder="ej. A"
                                    maxLength={3}
                                    className="w-full px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-[#181818] text-sm focus:outline-none focus:ring-2 focus:ring-[#BBF451] uppercase"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1.5">
                                    Ciclo escolar
                                </label>
                                <div className="px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-sm text-[#8E8E8E] bg-[#F5F5F5]">
                                    {SCHOOL_YEAR}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                style={{ backgroundColor: saving ? "#AADE40" : "#BBF451", color: "#181818" }}
                                className="w-full py-3.5 rounded-xl font-bold text-base shadow-lg disabled:opacity-60 active:scale-[0.98] transition-all"
                            >
                                {saving ? "Guardando..." : "Crear grupo"}
                            </button>
                        </form>
                    </div>
                </>
            )}

            <BottomNav />
        </div>
    );
}
