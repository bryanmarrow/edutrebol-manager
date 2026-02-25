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
    const [groupName, setGroupName] = useState("");
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [startTime, setStartTime] = useState("08:00");
    const [endTime, setEndTime] = useState("09:00");
    const [saving, setSaving] = useState(false);

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
        if (endTime <= startTime) {
            toast.error("La hora de fin debe ser mayor a la hora de inicio");
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
