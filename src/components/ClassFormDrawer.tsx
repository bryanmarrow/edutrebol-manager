"use client";

import { useState, useEffect } from "react";
import { X, BookOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClass, updateClass, getAllGroups } from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import type { ClassGroup, Group, ScheduleSlot } from "@/types";
import Link from "next/link";

interface ClassFormDrawerProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    classData?: ClassGroup | null;
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

const emptySlot = (): ScheduleSlot => ({ days: [], start_time: "08:00", end_time: "09:00" });

export function ClassFormDrawer({ open, onClose, onSaved, classData }: ClassFormDrawerProps) {
    const isEdit = !!classData;

    const [name, setName] = useState("");
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");
    const [slots, setSlots] = useState<ScheduleSlot[]>([emptySlot()]);
    const [saving, setSaving] = useState(false);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoadingGroups(true);
        getAllGroups().then((data) => {
            setGroups(data);
            setLoadingGroups(false);
        });
    }, [open]);

    useEffect(() => {
        if (classData) {
            setName(classData.name);
            setSelectedGroupId(classData.group_id ?? "");
            setSlots(classData.schedule?.length ? classData.schedule.map((s) => ({ ...s })) : [emptySlot()]);
        } else {
            setName("");
            setSelectedGroupId("");
            setSlots([emptySlot()]);
        }
    }, [classData, open]);

    function toggleSlotDay(slotIdx: number, day: number) {
        setSlots((prev) =>
            prev.map((slot, i) => {
                if (i !== slotIdx) return slot;
                const days = slot.days.includes(day)
                    ? slot.days.filter((d) => d !== day)
                    : [...slot.days, day];
                return { ...slot, days };
            })
        );
    }

    function updateSlotTime(slotIdx: number, field: "start_time" | "end_time", value: string) {
        setSlots((prev) =>
            prev.map((slot, i) => (i === slotIdx ? { ...slot, [field]: value } : slot))
        );
    }

    function addSlot() {
        setSlots((prev) => [...prev, emptySlot()]);
    }

    function removeSlot(slotIdx: number) {
        setSlots((prev) => prev.filter((_, i) => i !== slotIdx));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("El nombre de la clase es requerido");
            return;
        }
        if (!selectedGroupId) {
            toast.error("Selecciona un grupo");
            return;
        }

        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            if (slot.days.length === 0) {
                toast.error(`Horario ${i + 1}: selecciona al menos un día`);
                return;
            }
            if (slot.end_time <= slot.start_time) {
                toast.error(`Horario ${i + 1}: la hora de fin debe ser mayor a la de inicio`);
                return;
            }
        }

        const selectedGroup = groups.find((g) => g.id === selectedGroupId);
        if (!selectedGroup) {
            toast.error("Grupo no encontrado");
            return;
        }

        setSaving(true);
        try {
            if (isEdit && classData) {
                await updateClass(classData.id, {
                    name: name.trim(),
                    group_id: selectedGroupId,
                    grade: selectedGroup.grade,
                    section: selectedGroup.section,
                    schedule: slots,
                });
                toast.success("Clase actualizada");
            } else {
                await createClass({
                    name: name.trim(),
                    group_id: selectedGroupId,
                    grade: selectedGroup.grade,
                    section: selectedGroup.section,
                    schedule: slots,
                });
                toast.success("Clase creada");
            }

            onSaved();
            onClose();
        } catch (err) {
            console.error("Error saving class:", err);
            toast.error("Error al guardar la clase");
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    // Group groups by grade for the selector
    const byGrade: Record<number, Group[]> = {};
    for (const g of groups) {
        if (!byGrade[g.grade]) byGrade[g.grade] = [];
        byGrade[g.grade].push(g);
    }

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 z-[1000]" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col max-h-[90dvh] overflow-hidden">
                {/* Handle */}
                <div className="shrink-0 flex justify-center pt-4 pb-2 bg-white">
                    <div className="w-12 h-1.5 rounded-full bg-[#E0E0E0]" />
                </div>

                {/* Header */}
                <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0] bg-white text-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#181818]/10 rounded-xl text-[#BBF451]">
                            <BookOpen size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-[#181818]">
                            {isEdit ? "Editar clase" : "Nueva clase"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[#F5F5F5] text-[#8E8E8E] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] space-y-6 overflow-y-auto overscroll-contain flex-1">
                    {/* Class name */}
                    <div>
                        <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1.5">
                            Nombre de la clase
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ej. Matemáticas I"
                            className="w-full px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-[#181818] text-sm focus:outline-none focus:ring-2 focus:ring-[#BBF451]"
                        />
                    </div>

                    {/* Group selector */}
                    <div>
                        <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">
                            Grupo
                        </label>
                        {loadingGroups ? (
                            <div className="h-10 bg-[#F5F5F5] rounded-lg animate-pulse" />
                        ) : groups.length === 0 ? (
                            <div className="p-3 rounded-lg border border-dashed border-[#E0E0E0] text-center">
                                <p className="text-xs text-[#8E8E8E] mb-1">No hay grupos registrados.</p>
                                <Link href="/groups" className="text-xs font-semibold text-[#181818] hover:text-[#BBF451] transition-colors">
                                    Crear grupos →
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(byGrade).sort(([a], [b]) => Number(a) - Number(b)).map(([grade, gradeGroups]) => (
                                    <div key={grade}>
                                        <p className="text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">
                                            {formatGrade(Number(grade))}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {gradeGroups.map((g) => (
                                                <button
                                                    key={g.id}
                                                    type="button"
                                                    onClick={() => setSelectedGroupId(g.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                                        selectedGroupId === g.id
                                                            ? "bg-[#BBF451] text-[#181818]"
                                                            : "bg-[#F5F5F5] text-[#8E8E8E] hover:bg-[#E0E0E0]"
                                                    }`}
                                                >
                                                    {formatGrade(g.grade)} {g.section}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Schedule slots */}
                    <div>
                        <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-3">
                            Horarios
                        </label>

                        <div className="space-y-3">
                            {slots.map((slot, idx) => (
                                <div key={idx} className="rounded-xl border border-[#E0E0E0] p-3 space-y-3 bg-[#FAFAFA]">
                                    {/* Slot header */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-[#181818]">
                                            Horario {slots.length > 1 ? idx + 1 : ""}
                                        </span>
                                        {slots.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSlot(idx)}
                                                className="p-1 rounded-lg text-[#8E8E8E] hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Day selector */}
                                    <div className="flex gap-1.5">
                                        {DAYS.map((day) => (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => toggleSlotDay(idx, day.value)}
                                                className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors ${
                                                    slot.days.includes(day.value)
                                                        ? "bg-[#BBF451] text-[#181818]"
                                                        : "bg-white border border-[#E0E0E0] text-[#8E8E8E] hover:bg-[#F5F5F5]"
                                                }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Time range */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">
                                                Inicio
                                            </label>
                                            <input
                                                type="time"
                                                value={slot.start_time}
                                                onChange={(e) => updateSlotTime(idx, "start_time", e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-[#E0E0E0] text-[#181818] text-sm focus:outline-none focus:ring-2 focus:ring-[#BBF451] bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">
                                                Fin
                                            </label>
                                            <input
                                                type="time"
                                                value={slot.end_time}
                                                onChange={(e) => updateSlotTime(idx, "end_time", e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-[#E0E0E0] text-[#181818] text-sm focus:outline-none focus:ring-2 focus:ring-[#BBF451] bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add slot button */}
                        <button
                            type="button"
                            onClick={addSlot}
                            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#BBF451] text-[#181818] text-sm font-medium hover:bg-[#BBF451]/10 transition-colors"
                        >
                            <Plus size={15} />
                            Agregar otro horario
                        </button>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={saving}
                        style={{ backgroundColor: saving ? "#AADE40" : "#BBF451", color: "#181818" }}
                        className="w-full py-3.5 rounded-xl font-bold text-base shadow-lg disabled:opacity-60 active:scale-[0.98] transition-all"
                    >
                        {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear clase"}
                    </button>
                </form>
            </div>
        </>
    );
}
