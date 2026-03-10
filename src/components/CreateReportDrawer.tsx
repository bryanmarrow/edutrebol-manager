"use client";

import { useState, useEffect } from "react";
import { X, ClipboardList, Search, CheckSquare, Square, Users } from "lucide-react";
import { toast } from "sonner";
import { getAllGroups, getAllStudentsByGroup, createConductReport } from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import { REPORT_TYPE_LABELS, REPORT_TYPES } from "@/lib/conductReports";
import type { ConductReportType, Group } from "@/types";

interface CreateReportDrawerProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    preselectedGroupId?: string;
    preselectedStudentId?: string;
}

interface Student {
    id: string;
    first_name: string;
    last_name: string;
}

const today = () => new Date().toISOString().split("T")[0];

export function CreateReportDrawer({
    open,
    onClose,
    onSaved,
    preselectedGroupId,
    preselectedStudentId,
}: CreateReportDrawerProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const [selectedGroupId, setSelectedGroupId] = useState<string>(preselectedGroupId ?? "");
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [studentSearch, setStudentSearch] = useState("");
    const [selectedType, setSelectedType] = useState<ConductReportType | "">("");
    const [notes, setNotes] = useState("");
    const [date, setDate] = useState(today());
    const [saving, setSaving] = useState(false);

    // Reset on open
    useEffect(() => {
        if (!open) return;
        getAllGroups().then(setGroups);
        setSelectedGroupId(preselectedGroupId ?? "");
        setSelectedStudentIds(preselectedStudentId ? new Set([preselectedStudentId]) : new Set());
        setStudentSearch("");
        setSelectedType("");
        setNotes("");
        setDate(today());
    }, [open, preselectedGroupId, preselectedStudentId]);

    // Load students when group changes
    useEffect(() => {
        if (!selectedGroupId) { setStudents([]); setSelectedStudentIds(new Set()); return; }
        setLoadingStudents(true);
        getAllStudentsByGroup(selectedGroupId).then((data) => {
            const active = data.filter((s: any) => s.active) as Student[];
            setStudents(active);
            // Keep preselected student if it belongs to this group
            setSelectedStudentIds((prev) => {
                const valid = new Set([...prev].filter((id) => active.some((s) => s.id === id)));
                return valid;
            });
            setLoadingStudents(false);
        });
    }, [selectedGroupId]);

    const filteredStudents = [...students]
        .sort((a, b) => a.last_name.localeCompare(b.last_name))
        .filter((s) => {
            const term = studentSearch.toLowerCase();
            return s.last_name.toLowerCase().includes(term) || s.first_name.toLowerCase().includes(term);
        });

    const allSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.has(s.id));

    function toggleStudent(id: string) {
        setSelectedStudentIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    function toggleAll() {
        if (allSelected) {
            setSelectedStudentIds((prev) => {
                const next = new Set(prev);
                filteredStudents.forEach((s) => next.delete(s.id));
                return next;
            });
        } else {
            setSelectedStudentIds((prev) => {
                const next = new Set(prev);
                filteredStudents.forEach((s) => next.add(s.id));
                return next;
            });
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedGroupId) { toast.error("Selecciona un grupo"); return; }
        if (selectedStudentIds.size === 0) { toast.error("Selecciona al menos un alumno"); return; }
        if (!selectedType) { toast.error("Selecciona el tipo de reporte"); return; }
        if (selectedType === "other" && !notes.trim()) { toast.error("Agrega una nota para el tipo Otro"); return; }

        setSaving(true);
        try {
            await Promise.all(
                [...selectedStudentIds].map((studentId) =>
                    createConductReport({
                        student_id: studentId,
                        group_id: selectedGroupId,
                        type: selectedType,
                        notes: notes.trim() || undefined,
                        date,
                    })
                )
            );
            const count = selectedStudentIds.size;
            toast.success(`${count} reporte${count !== 1 ? "s" : ""} registrado${count !== 1 ? "s" : ""}`);
            onSaved();
            onClose();
        } catch {
            toast.error("Error al registrar reportes");
        }
        setSaving(false);
    }

    if (!open) return null;

    const byGrade: Record<number, Group[]> = {};
    for (const g of groups) {
        if (!byGrade[g.grade]) byGrade[g.grade] = [];
        byGrade[g.grade].push(g);
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-[1000]" onClick={onClose} />
            <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col max-h-[92dvh] overflow-hidden">
                {/* Handle */}
                <div className="shrink-0 flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1.5 rounded-full bg-[#E0E0E0]" />
                </div>

                {/* Header */}
                <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#181818]/10 rounded-xl">
                            <ClipboardList size={20} className="text-[#BBF451]" />
                        </div>
                        <h2 className="text-lg font-bold text-[#181818]">Nuevo reporte</h2>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-[#F5F5F5] text-[#8E8E8E]">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] space-y-5">
                    {/* Grupo */}
                    <div>
                        <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">Grupo</label>
                        <div className="space-y-2">
                            {Object.entries(byGrade).sort(([a], [b]) => Number(a) - Number(b)).map(([grade, gradeGroups]) => (
                                <div key={grade}>
                                    <p className="text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">{formatGrade(Number(grade))}</p>
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
                    </div>

                    {/* Alumnos — checkbox list */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide">
                                Alumnos
                                {selectedStudentIds.size > 0 && (
                                    <span className="ml-2 normal-case font-normal text-[#181818]">
                                        · {selectedStudentIds.size} seleccionado{selectedStudentIds.size !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </label>
                            {students.length > 0 && (
                                <button
                                    type="button"
                                    onClick={toggleAll}
                                    className="flex items-center gap-1 text-xs text-[#8E8E8E] hover:text-[#181818] transition-colors"
                                >
                                    {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                                    {allSelected ? "Ninguno" : "Todos"}
                                </button>
                            )}
                        </div>

                        {!selectedGroupId ? (
                            <p className="text-xs text-[#8E8E8E]">Selecciona un grupo primero</p>
                        ) : loadingStudents ? (
                            <div className="h-11 bg-[#F5F5F5] rounded-lg animate-pulse" />
                        ) : students.length === 0 ? (
                            <p className="text-xs text-[#8E8E8E]">No hay alumnos en este grupo</p>
                        ) : (
                            <>
                                {/* Search */}
                                <div className="relative mb-2">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E8E] pointer-events-none" />
                                    <input
                                        type="text"
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                        placeholder="Buscar alumno..."
                                        className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#E0E0E0] text-sm text-[#181818] bg-white focus:outline-none focus:ring-2 focus:ring-[#BBF451] placeholder:text-[#8E8E8E]"
                                    />
                                </div>

                                {/* Checkbox list */}
                                <div className="rounded-xl border border-[#E0E0E0] divide-y divide-[#F5F5F5] max-h-48 overflow-y-auto">
                                    {filteredStudents.length === 0 ? (
                                        <p className="px-4 py-3 text-xs text-[#8E8E8E]">Sin resultados</p>
                                    ) : (
                                        filteredStudents.map((s) => {
                                            const checked = selectedStudentIds.has(s.id);
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => toggleStudent(s.id)}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${checked ? "bg-[#BBF451]/10" : "hover:bg-[#F5F5F5]"}`}
                                                >
                                                    {checked
                                                        ? <CheckSquare size={16} className="shrink-0 text-[#181818]" />
                                                        : <Square size={16} className="shrink-0 text-[#C0C0C0]" />
                                                    }
                                                    <span className="text-sm text-[#181818] truncate">
                                                        {s.last_name}{" "}
                                                        <span className="text-[#8E8E8E] font-normal">{s.first_name}</span>
                                                    </span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Tipo */}
                    <div>
                        <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">Tipo de incidente</label>
                        <div className="grid grid-cols-2 gap-2">
                            {REPORT_TYPES.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setSelectedType(type)}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-colors ${
                                        selectedType === type
                                            ? "bg-[#181818] text-white"
                                            : "bg-[#F5F5F5] text-[#8E8E8E] hover:bg-[#E0E0E0]"
                                    }`}
                                >
                                    {REPORT_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1.5">
                            Notas {selectedType === "other" ? <span className="text-rose-500">*</span> : <span className="font-normal normal-case">(opcional)</span>}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe el incidente..."
                            rows={3}
                            className="w-full px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-sm text-[#181818] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-2 focus:ring-[#BBF451] resize-none"
                        />
                    </div>

                    {/* Fecha */}
                    <div>
                        <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1.5">Fecha</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-sm text-[#181818] focus:outline-none focus:ring-2 focus:ring-[#BBF451]"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={saving || selectedStudentIds.size === 0}
                        style={{ backgroundColor: saving ? "#AADE40" : "#BBF451", color: "#181818" }}
                        className="w-full py-3.5 rounded-xl font-bold text-base shadow-lg disabled:opacity-60 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <div className="h-4 w-4 border-2 border-[#181818]/30 border-t-[#181818] rounded-full animate-spin" />
                        ) : (
                            <Users size={16} />
                        )}
                        {saving
                            ? "Registrando..."
                            : selectedStudentIds.size === 0
                            ? "Selecciona alumnos"
                            : `Registrar ${selectedStudentIds.size} reporte${selectedStudentIds.size !== 1 ? "s" : ""}`
                        }
                    </button>
                </form>
            </div>
        </>
    );
}
