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

export function ClassFormDrawer({ open, onClose, onSaved, classData }: ClassFormDrawerProps) {
    const isEdit = !!classData;

    const [name, setName] = useState("");
    const [grade, setGrade] = useState<number>(0);
    const [section, setSection] = useState("");
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [startTime, setStartTime] = useState("08:00");
    const [endTime, setEndTime] = useState("09:00");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (classData) {
            setName(classData.name);
            setGrade(classData.grade as number);
            setSection(classData.section);
            setSelectedDays(classData.schedule?.days || []);
            setStartTime(classData.schedule?.start_time || "08:00");
            setEndTime(classData.schedule?.end_time || "09:00");
        } else {
            setName("");
            setGrade(0);
            setSection("");
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

        if (!name.trim() || grade === 0 || !section.trim()) {
            toast.error("Nombre, grado y grupo son requeridos");
            return;
        }
        if (selectedDays.length === 0) {
            toast.error("Selecciona al menos un día");
            return;
        }
        if (endTime <= startTime) {
            toast.error("La hora de fin debe ser mayor a la hora de inicio");
            return;
        }

        setSaving(true);
        try {
            const schedule = { days: selectedDays, start_time: startTime, end_time: endTime };

            if (isEdit && classData) {
                await updateClass(classData.id, { name: name.trim(), grade, section: section.trim(), schedule });
                toast.success("Clase actualizada");
            } else {
                await createClass({ name: name.trim(), grade, section: section.trim(), schedule });
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

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-[1000]"
                onClick={onClose}
            />

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

                    {/* Grade selector */}
                    <div>
                        <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">
                            Grado
                        </label>
                        <div className="flex gap-3">
                            {([1, 2, 3] as const).map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGrade(g)}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                                        grade === g
                                            ? "bg-[#BBF451] text-[#181818]"
                                            : "bg-[#F5F5F5] text-[#8E8E8E] hover:bg-[#E0E0E0]"
                                    }`}
                                >
                                    {g === 1 ? "1ero" : g === 2 ? "2do" : "3ero"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section */}
                    <div>
                        <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1.5">
                            Grupo
                        </label>
                        <input
                            type="text"
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            placeholder="ej. A"
                            className="w-full px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-[#181818] text-sm focus:outline-none focus:ring-2 focus:ring-[#BBF451]"
                        />
                    </div>

                    {/* Days selector */}
                    <div>
                        <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">
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
                                            ? "bg-[#BBF451] text-[#181818]"
                                            : "bg-[#F5F5F5] text-[#8E8E8E] hover:bg-[#E0E0E0]"
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
                            <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1.5">
                                Hora inicio
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-[#181818] text-sm focus:outline-none focus:ring-2 focus:ring-[#BBF451]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1.5">
                                Hora fin
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-[#181818] text-sm focus:outline-none focus:ring-2 focus:ring-[#BBF451]"
                            />
                        </div>
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
