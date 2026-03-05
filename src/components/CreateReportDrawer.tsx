"use client";

import { useState, useEffect, useRef } from "react";
import { X, ClipboardList, Search, ChevronDown } from "lucide-react";
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
}

interface Student {
    id: string;
    first_name: string;
    last_name: string;
}

const today = () => new Date().toISOString().split("T")[0];

export function CreateReportDrawer({ open, onClose, onSaved, preselectedGroupId }: CreateReportDrawerProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const [selectedGroupId, setSelectedGroupId] = useState<string>(preselectedGroupId ?? "");
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [studentSearch, setStudentSearch] = useState("");
    const [showStudentList, setShowStudentList] = useState(false);
    const studentComboRef = useRef<HTMLDivElement>(null);
    const [selectedType, setSelectedType] = useState<ConductReportType | "">("");
    const [notes, setNotes] = useState("");
    const [date, setDate] = useState(today());
    const [saving, setSaving] = useState(false);

    // Load groups on open
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

    // Load students when group changes
    useEffect(() => {
        if (!selectedGroupId) {
            setStudents([]);
            setSelectedStudentId("");
            return;
        }
        setLoadingStudents(true);
        setSelectedStudentId("");
        setStudentSearch("");
        getAllStudentsByGroup(selectedGroupId).then((data) => {
            setStudents(data.filter((s: any) => s.active));
            setLoadingStudents(false);
        });
    }, [selectedGroupId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!selectedGroupId) { toast.error("Selecciona un grupo"); return; }
        if (!selectedStudentId) { toast.error("Selecciona un alumno"); return; }
        if (!selectedType) { toast.error("Selecciona el tipo de reporte"); return; }
        if (selectedType === "other" && !notes.trim()) { toast.error("Agrega una nota para el tipo Otro"); return; }

        setSaving(true);
        try {
            await createConductReport({
                student_id: selectedStudentId,
                group_id: selectedGroupId,
                type: selectedType,
                notes: notes.trim() || undefined,
                date,
            });
            toast.success("Reporte registrado");
            onSaved();
            onClose();
        } catch {
            toast.error("Error al registrar reporte");
        }
        setSaving(false);
    }

    if (!open) return null;

    // Group by grade for display
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

                    {/* Alumno */}
                    <div>
                        <label className="block text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">Alumno</label>
                        {!selectedGroupId ? (
                            <p className="text-xs text-[#8E8E8E]">Selecciona un grupo primero</p>
                        ) : loadingStudents ? (
                            <div className="h-11 bg-[#F5F5F5] rounded-lg animate-pulse" />
                        ) : students.length === 0 ? (
                            <p className="text-xs text-[#8E8E8E]">No hay alumnos en este grupo</p>
                        ) : (() => {
                            const sorted = [...students].sort((a, b) => a.last_name.localeCompare(b.last_name));
                            const term = studentSearch.toLowerCase();
                            const filtered = term
                                ? sorted.filter((s) =>
                                    s.last_name.toLowerCase().includes(term) ||
                                    s.first_name.toLowerCase().includes(term)
                                )
                                : sorted;
                            const selected = students.find((s) => s.id === selectedStudentId);

                            return (
                                <div ref={studentComboRef} className="relative">
                                    {/* Input */}
                                    <div className="relative">
                                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E8E] pointer-events-none" />
                                        <input
                                            type="text"
                                            value={showStudentList ? studentSearch : (selected ? `${selected.last_name} ${selected.first_name}` : "")}
                                            onFocus={() => {
                                                setStudentSearch("");
                                                setShowStudentList(true);
                                            }}
                                            onChange={(e) => {
                                                setStudentSearch(e.target.value);
                                                setShowStudentList(true);
                                            }}
                                            onBlur={() => setTimeout(() => setShowStudentList(false), 150)}
                                            placeholder="Buscar alumno..."
                                            className="w-full h-11 pl-9 pr-9 rounded-lg border border-[#E0E0E0] text-sm text-[#181818] bg-white focus:outline-none focus:ring-2 focus:ring-[#BBF451] placeholder:text-[#8E8E8E]"
                                        />
                                        {selectedStudentId ? (
                                            <button
                                                type="button"
                                                onMouseDown={(e) => { e.preventDefault(); setSelectedStudentId(""); setStudentSearch(""); }}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E8E] hover:text-[#181818]"
                                            >
                                                <X size={15} />
                                            </button>
                                        ) : (
                                            <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E8E] pointer-events-none" />
                                        )}
                                    </div>

                                    {/* Dropdown */}
                                    {showStudentList && (
                                        <div className="absolute z-10 mt-1 w-full bg-white border border-[#E0E0E0] rounded-lg shadow-lg max-h-52 overflow-y-auto">
                                            {filtered.length === 0 ? (
                                                <p className="px-3 py-3 text-xs text-[#8E8E8E]">Sin resultados</p>
                                            ) : (
                                                filtered.map((s) => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onMouseDown={() => {
                                                            setSelectedStudentId(s.id);
                                                            setStudentSearch("");
                                                            setShowStudentList(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-[#F5F5F5] transition-colors ${selectedStudentId === s.id ? "bg-[#BBF451]/20 font-semibold text-[#181818]" : "text-[#181818]"}`}
                                                    >
                                                        {s.last_name} <span className="text-[#8E8E8E] font-normal">{s.first_name}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
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
                        disabled={saving}
                        style={{ backgroundColor: saving ? "#AADE40" : "#BBF451", color: "#181818" }}
                        className="w-full py-3.5 rounded-xl font-bold text-base shadow-lg disabled:opacity-60 active:scale-[0.98] transition-all"
                    >
                        {saving ? "Registrando..." : "Registrar reporte"}
                    </button>
                </form>
            </div>
        </>
    );
}
