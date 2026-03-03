"use client";

import { useState, useEffect, useCallback } from "react";
import { Toaster, toast } from "sonner";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import {
    getTeacherClasses,
    updateClassSchedule,
} from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import type { ClassGroup } from "@/types";
import {
    Calendar,
    Clock,
    Check,
    X,
    ChevronDown,
    ChevronUp,
    Save,
} from "lucide-react";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_VALUES = [0, 1, 2, 3, 4, 5, 6]; // 0=Sun through 6=Sat (matching schema: 1-5=weekdays)

export default function SchedulePage() {
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);

    // Editing state per class
    const [editDays, setEditDays] = useState<number[]>([]);
    const [editStart, setEditStart] = useState("08:00");
    const [editEnd, setEditEnd] = useState("09:00");

    const loadData = useCallback(async () => {
        const data = await getTeacherClasses();
        setClasses(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openEditor = (cls: ClassGroup) => {
        if (expandedId === cls.id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(cls.id);
        setEditDays(cls.schedule?.days || []);
        setEditStart(cls.schedule?.start_time || "08:00");
        setEditEnd(cls.schedule?.end_time || "09:00");
    };

    const toggleDay = (day: number) => {
        setEditDays((prev) =>
            prev.includes(day)
                ? prev.filter((d) => d !== day)
                : [...prev, day].sort((a, b) => a - b)
        );
    };

    const handleSave = async (classId: string) => {
        if (editDays.length === 0) {
            toast.error("Selecciona al menos un día");
            return;
        }
        if (editStart >= editEnd) {
            toast.error("La hora de inicio debe ser antes de la hora de fin");
            return;
        }

        setSaving(classId);
        try {
            await updateClassSchedule(classId, {
                days: editDays,
                start_time: editStart,
                end_time: editEnd,
            });
            toast.success("Horario actualizado");
            await loadData();
            setExpandedId(null);
        } catch {
            toast.error("Error al guardar horario");
        }
        setSaving(null);
    };

    const formatDays = (days?: number[]) => {
        if (!days || days.length === 0) return "Sin horario";
        return days.map((d) => DAY_NAMES[d]).join(", ");
    };

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-28">
            <Toaster position="top-center" richColors />
            <TopBar title="Mi Horario" />

            <main className="px-4 py-4">
                {/* Weekly overview header */}
                <div className="bg-white rounded-xl border border-[#E0E0E0] p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar size={18} className="text-[#BBF451]" />
                        <h2 className="text-sm font-bold text-[#181818]">Calendario Semanal</h2>
                    </div>
                    <p className="text-xs text-[#8E8E8E]">
                        Configura los días y horarios de cada clase. El dashboard mostrará solo las clases que corresponden al día actual.
                    </p>
                </div>

                {/* Class list */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-[#E0E0E0]" />
                        ))}
                    </div>
                ) : classes.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-[#E0E0E0] text-center">
                        <Calendar size={32} className="mx-auto text-[#8E8E8E] mb-2" />
                        <p className="text-[#8E8E8E] text-sm">No tienes clases registradas</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {classes.map((cls) => {
                            const isExpanded = expandedId === cls.id;
                            const isSaving = saving === cls.id;

                            return (
                                <div
                                    key={cls.id}
                                    className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden transition-all"
                                >
                                    {/* Card header — tap to expand */}
                                    <button
                                        onClick={() => openEditor(cls)}
                                        className="w-full flex items-center justify-between p-4 text-left"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-sm font-bold text-[#181818]">{cls.name}</h3>
                                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#F5F5F5] text-[#181818] border border-[#E0E0E0]">
                                                    {formatGrade(cls.grade)} {cls.section}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-[#8E8E8E]">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {formatDays(cls.schedule?.days)}
                                                </span>
                                                {cls.schedule?.start_time && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {cls.schedule.start_time} — {cls.schedule.end_time}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp size={18} className="text-[#8E8E8E]" />
                                        ) : (
                                            <ChevronDown size={18} className="text-[#8E8E8E]" />
                                        )}
                                    </button>

                                    {/* Expanded editor */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-t border-[#E0E0E0] pt-4 space-y-4">
                                            {/* Day selector */}
                                            <div>
                                                <label className="block text-xs font-semibold text-[#181818] mb-2">Días de clase</label>
                                                <div className="flex gap-1.5">
                                                    {DAY_VALUES.map((day) => {
                                                        const isActive = editDays.includes(day);
                                                        return (
                                                            <button
                                                                key={day}
                                                                onClick={() => toggleDay(day)}
                                                                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${isActive
                                                                        ? "bg-[#BBF451] text-[#181818] shadow-sm"
                                                                        : "bg-[#F5F5F5] text-[#8E8E8E] hover:bg-[#E0E0E0]"
                                                                    }`}
                                                            >
                                                                {DAY_NAMES[day]}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Time selector */}
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-[#181818] mb-1">Hora inicio</label>
                                                    <input
                                                        type="time"
                                                        value={editStart}
                                                        onChange={(e) => setEditStart(e.target.value)}
                                                        className="w-full px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-sm text-[#181818] focus:outline-none focus:ring-2 focus:ring-[#BBF451] focus:border-transparent"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-[#181818] mb-1">Hora fin</label>
                                                    <input
                                                        type="time"
                                                        value={editEnd}
                                                        onChange={(e) => setEditEnd(e.target.value)}
                                                        className="w-full px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-sm text-[#181818] focus:outline-none focus:ring-2 focus:ring-[#BBF451] focus:border-transparent"
                                                    />
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3 pt-1">
                                                <button
                                                    onClick={() => setExpandedId(null)}
                                                    className="flex-1 py-2.5 rounded-lg border border-[#E0E0E0] text-sm font-medium text-[#181818] hover:bg-[#F5F5F5] flex items-center justify-center gap-1.5"
                                                >
                                                    <X size={14} /> Cancelar
                                                </button>
                                                <button
                                                    onClick={() => handleSave(cls.id)}
                                                    disabled={isSaving}
                                                    className="flex-1 py-2.5 rounded-lg bg-[#BBF451] text-[#181818] text-sm font-semibold hover:bg-[#AADE40] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                                >
                                                    {isSaving ? (
                                                        <div className="h-4 w-4 border-2 border-[#181818]/30 border-t-[#181818] rounded-full animate-spin" />
                                                    ) : (
                                                        <Save size={14} />
                                                    )}
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Weekly preview */}
                {!loading && classes.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-bold text-[#8E8E8E] uppercase tracking-wider mb-3">Vista semanal</h3>
                        <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
                            {DAY_NAMES.slice(1, 7).map((dayName, idx) => {
                                const dayNum = idx + 1; // 1=Mon through 6=Sat
                                const dayClasses = classes
                                    .filter((c) => c.schedule?.days?.includes(dayNum))
                                    .sort((a, b) => (a.schedule?.start_time || "").localeCompare(b.schedule?.start_time || ""));
                                const isToday = new Date().getDay() === dayNum;

                                return (
                                    <div
                                        key={dayNum}
                                        className={`flex items-start gap-3 px-4 py-3 border-b border-[#F5F5F5] last:border-b-0 ${isToday ? "bg-[#BBF451]/10" : ""}`}
                                    >
                                        <div className={`w-10 text-center shrink-0 ${isToday ? "font-bold text-[#181818]" : "text-[#8E8E8E]"}`}>
                                            <span className="text-xs">{dayName}</span>
                                        </div>
                                        <div className="flex-1">
                                            {dayClasses.length === 0 ? (
                                                <span className="text-xs text-[#8E8E8E]">Sin clases</span>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {dayClasses.map((c) => (
                                                        <span
                                                            key={c.id}
                                                            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#BBF451]/20 text-[#181818]"
                                                        >
                                                            {c.schedule?.start_time} {c.name} {formatGrade(c.grade)} {c.section}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
