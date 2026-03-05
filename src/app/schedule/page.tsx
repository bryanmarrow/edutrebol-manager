"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { getTeacherClasses, updateClassSchedule } from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import type { ClassGroup, ScheduleSlot } from "@/types";
import {
    Calendar,
    Clock,
    X,
    ChevronDown,
    ChevronUp,
    Save,
    Plus,
    Trash2,
} from "lucide-react";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_VALUES = [0, 1, 2, 3, 4, 5, 6];

const emptySlot = (): ScheduleSlot => ({ days: [], start_time: "08:00", end_time: "09:00" });

export default function SchedulePage() {
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);

    // Editing state — array of slots for the currently expanded class
    const [editSlots, setEditSlots] = useState<ScheduleSlot[]>([emptySlot()]);

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
        setEditSlots(cls.schedule?.length ? cls.schedule.map((s) => ({ ...s })) : [emptySlot()]);
    };

    const toggleSlotDay = (slotIdx: number, day: number) => {
        setEditSlots((prev) =>
            prev.map((slot, i) => {
                if (i !== slotIdx) return slot;
                const days = slot.days.includes(day)
                    ? slot.days.filter((d) => d !== day)
                    : [...slot.days, day].sort((a, b) => a - b);
                return { ...slot, days };
            })
        );
    };

    const updateSlotTime = (slotIdx: number, field: "start_time" | "end_time", value: string) => {
        setEditSlots((prev) =>
            prev.map((slot, i) => (i === slotIdx ? { ...slot, [field]: value } : slot))
        );
    };

    const addSlot = () => setEditSlots((prev) => [...prev, emptySlot()]);

    const removeSlot = (slotIdx: number) =>
        setEditSlots((prev) => prev.filter((_, i) => i !== slotIdx));

    const handleSave = async (classId: string) => {
        for (let i = 0; i < editSlots.length; i++) {
            const slot = editSlots[i];
            if (slot.days.length === 0) {
                toast.error(`Horario ${i + 1}: selecciona al menos un día`);
                return;
            }
            if (slot.start_time >= slot.end_time) {
                toast.error(`Horario ${i + 1}: la hora de inicio debe ser antes de la hora de fin`);
                return;
            }
        }

        setSaving(classId);
        try {
            await updateClassSchedule(classId, editSlots);
            toast.success("Horario actualizado");
            await loadData();
            setExpandedId(null);
        } catch {
            toast.error("Error al guardar horario");
        }
        setSaving(null);
    };

    const formatScheduleSummary = (schedule?: ScheduleSlot[]) => {
        if (!schedule?.length) return "Sin horario";
        return schedule
            .map((s) => s.days.map((d) => DAY_NAMES[d]).join(","))
            .join(" / ");
    };

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-28">
            <TopBar title="Mi Horario" />

            <main className="px-4 py-4">
                {/* Weekly overview header */}
                <div className="bg-white rounded-xl border border-[#E0E0E0] p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar size={18} className="text-[#BBF451]" />
                        <h2 className="text-sm font-bold text-[#181818]">Calendario Semanal</h2>
                    </div>
                    <p className="text-xs text-[#8E8E8E]">
                        Configura los días y horarios de cada clase. Puedes agregar múltiples bloques con distintos días y horas.
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
                                    {/* Card header */}
                                    <button
                                        onClick={() => openEditor(cls)}
                                        className="w-full flex items-center justify-between p-4 text-left"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-sm font-bold text-[#181818]">{cls.name}</h3>
                                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#F5F5F5] text-[#181818] border border-[#E0E0E0]">
                                                    {formatGrade(cls.grade)} {cls.section}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-[#8E8E8E]">
                                                <span className="flex items-center gap-1 truncate">
                                                    <Calendar size={12} className="shrink-0" />
                                                    {formatScheduleSummary(cls.schedule)}
                                                </span>
                                                {cls.schedule?.length === 1 && cls.schedule[0].start_time && (
                                                    <span className="flex items-center gap-1 shrink-0">
                                                        <Clock size={12} />
                                                        {cls.schedule[0].start_time} — {cls.schedule[0].end_time}
                                                    </span>
                                                )}
                                                {(cls.schedule?.length ?? 0) > 1 && (
                                                    <span className="shrink-0 text-[#BBF451] font-semibold">
                                                        {cls.schedule!.length} horarios
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp size={18} className="text-[#8E8E8E] shrink-0 ml-2" />
                                        ) : (
                                            <ChevronDown size={18} className="text-[#8E8E8E] shrink-0 ml-2" />
                                        )}
                                    </button>

                                    {/* Expanded editor */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-t border-[#E0E0E0] pt-4 space-y-3">
                                            {editSlots.map((slot, idx) => (
                                                <div key={idx} className="rounded-xl border border-[#E0E0E0] p-3 space-y-3 bg-[#FAFAFA]">
                                                    {/* Slot header */}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-[#181818]">
                                                            {editSlots.length > 1 ? `Horario ${idx + 1}` : "Horario"}
                                                        </span>
                                                        {editSlots.length > 1 && (
                                                            <button
                                                                onClick={() => removeSlot(idx)}
                                                                className="p-1 rounded-lg text-[#8E8E8E] hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Day selector */}
                                                    <div className="flex gap-1">
                                                        {DAY_VALUES.map((day) => {
                                                            const isActive = slot.days.includes(day);
                                                            return (
                                                                <button
                                                                    key={day}
                                                                    onClick={() => toggleSlotDay(idx, day)}
                                                                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                                                        isActive
                                                                            ? "bg-[#BBF451] text-[#181818] shadow-sm"
                                                                            : "bg-white border border-[#E0E0E0] text-[#8E8E8E] hover:bg-[#F5F5F5]"
                                                                    }`}
                                                                >
                                                                    {DAY_NAMES[day]}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Time selector */}
                                                    <div className="flex gap-3">
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] font-semibold text-[#8E8E8E] mb-1">Inicio</label>
                                                            <input
                                                                type="time"
                                                                value={slot.start_time}
                                                                onChange={(e) => updateSlotTime(idx, "start_time", e.target.value)}
                                                                className="w-full px-3 py-2 rounded-lg border border-[#E0E0E0] text-sm text-[#181818] bg-white focus:outline-none focus:ring-2 focus:ring-[#BBF451] focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] font-semibold text-[#8E8E8E] mb-1">Fin</label>
                                                            <input
                                                                type="time"
                                                                value={slot.end_time}
                                                                onChange={(e) => updateSlotTime(idx, "end_time", e.target.value)}
                                                                className="w-full px-3 py-2 rounded-lg border border-[#E0E0E0] text-sm text-[#181818] bg-white focus:outline-none focus:ring-2 focus:ring-[#BBF451] focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add slot */}
                                            <button
                                                onClick={addSlot}
                                                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[#BBF451] text-[#181818] text-xs font-medium hover:bg-[#BBF451]/10 transition-colors"
                                            >
                                                <Plus size={13} />
                                                Agregar horario
                                            </button>

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
                                // Collect all (class, slot) pairs for this day
                                const dayEntries = classes.flatMap((c) =>
                                    (c.schedule ?? [])
                                        .filter((s) => s.days.includes(dayNum))
                                        .map((s) => ({ cls: c, slot: s }))
                                ).sort((a, b) => a.slot.start_time.localeCompare(b.slot.start_time));

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
                                            {dayEntries.length === 0 ? (
                                                <span className="text-xs text-[#8E8E8E]">Sin clases</span>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {dayEntries.map(({ cls, slot }, i) => (
                                                        <span
                                                            key={`${cls.id}-${i}`}
                                                            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#BBF451]/20 text-[#181818]"
                                                        >
                                                            {slot.start_time} {cls.name} {formatGrade(cls.grade)} {cls.section}
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
