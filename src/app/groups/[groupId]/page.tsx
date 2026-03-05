"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import {
    getGroupById,
    getAllStudentsByGroup,
    createStudent,
    updateStudent,
    deleteStudent,
    bulkCreateStudents,
    getStudentIdsWithReports,
    bulkDeleteStudents,
} from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import {
    UserPlus,
    Pencil,
    Trash2,
    X,
    Check,
    Search,
    Users,
    ToggleLeft,
    ToggleRight,
    Upload,
    ShieldAlert,
} from "lucide-react";
import type { Group } from "@/types";

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    student_id_official: string | null;
    active: boolean;
    group_id: string;
}

export default function GroupDetailPage() {
    const params = useParams();
    const groupId = params.groupId as string;

    const [students, setStudents] = useState<Student[]>([]);
    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formFirstName, setFormFirstName] = useState("");
    const [formLastName, setFormLastName] = useState("");
    const [formIdOfficial, setFormIdOfficial] = useState("");
    const [saving, setSaving] = useState(false);

    // Delete confirmation
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Bulk import
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [bulkImporting, setBulkImporting] = useState(false);

    // Delete all
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [deleteAllLoading, setDeleteAllLoading] = useState(false);
    const [protectedIds, setProtectedIds] = useState<Set<string>>(new Set());
    const [deleteAllReady, setDeleteAllReady] = useState(false);

    const loadData = useCallback(async () => {
        const [groupData, studentsData] = await Promise.all([
            getGroupById(groupId),
            getAllStudentsByGroup(groupId),
        ]);
        if (groupData) setGroup(groupData);
        setStudents(studentsData);
        setLoading(false);
    }, [groupId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filtered = students.filter((s) => {
        const term = search.toLowerCase();
        return (
            s.first_name.toLowerCase().includes(term) ||
            s.last_name.toLowerCase().includes(term) ||
            (s.student_id_official || "").toLowerCase().includes(term)
        );
    });

    const activeCount = students.filter((s) => s.active).length;
    const inactiveCount = students.filter((s) => !s.active).length;

    const openAddModal = () => {
        setEditingStudent(null);
        setFormFirstName("");
        setFormLastName("");
        setFormIdOfficial("");
        setShowModal(true);
    };

    const openEditModal = (student: Student) => {
        setEditingStudent(student);
        setFormFirstName(student.first_name);
        setFormLastName(student.last_name);
        setFormIdOfficial(student.student_id_official || "");
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formFirstName.trim() || !formLastName.trim()) {
            toast.error("Nombre y apellidos son obligatorios");
            return;
        }

        setSaving(true);
        try {
            if (editingStudent) {
                await updateStudent(editingStudent.id, {
                    first_name: formFirstName.trim(),
                    last_name: formLastName.trim(),
                    student_id_official: formIdOfficial.trim() || undefined,
                });
                toast.success("Alumno actualizado");
            } else {
                await createStudent(groupId, {
                    first_name: formFirstName.trim(),
                    last_name: formLastName.trim(),
                    student_id_official: formIdOfficial.trim() || undefined,
                });
                toast.success("Alumno agregado");
            }
            setShowModal(false);
            await loadData();
        } catch {
            toast.error("Error al guardar");
        }
        setSaving(false);
    };

    const handleToggleActive = async (student: Student) => {
        try {
            await updateStudent(student.id, { active: !student.active });
            await loadData();
            toast.success(student.active ? "Alumno dado de baja" : "Alumno reactivado");
        } catch {
            toast.error("Error al cambiar estado");
        }
    };

    const handleDelete = async (studentId: string) => {
        try {
            await deleteStudent(studentId);
            setDeletingId(null);
            await loadData();
            toast.success("Alumno eliminado");
        } catch {
            toast.error("Error al eliminar");
        }
    };

    const openDeleteAllModal = async () => {
        setDeleteAllReady(false);
        setShowDeleteAllModal(true);
        const ids = await getStudentIdsWithReports(groupId);
        setProtectedIds(ids);
        setDeleteAllReady(true);
    };

    const handleDeleteAll = async () => {
        const toDelete = students.filter((s) => !protectedIds.has(s.id)).map((s) => s.id);
        if (toDelete.length === 0) return;

        setDeleteAllLoading(true);
        try {
            await bulkDeleteStudents(toDelete);
            toast.success(`${toDelete.length} alumno${toDelete.length !== 1 ? "s" : ""} eliminado${toDelete.length !== 1 ? "s" : ""}`);
            setShowDeleteAllModal(false);
            await loadData();
        } catch {
            toast.error("Error al eliminar alumnos");
        }
        setDeleteAllLoading(false);
    };

    type ParsedRow =
        | { raw: string; valid: false }
        | { raw: string; valid: true; last_name: string; first_name: string };

    function parseBulkText(text: string): ParsedRow[] {
        return text
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const words = line.split(/\s+/);
                if (words.length < 3) return { raw: line, valid: false as const };
                return {
                    raw: line,
                    valid: true as const,
                    last_name: `${words[0]} ${words[1]}`,
                    first_name: words.slice(2).join(" "),
                };
            });
    }

    async function handleBulkImport() {
        const parsed = parseBulkText(bulkText);
        const valid = parsed.filter((r): r is Extract<ParsedRow, { valid: true }> => r.valid);
        if (!valid.length) return;

        setBulkImporting(true);
        try {
            await bulkCreateStudents(groupId, valid);
            toast.success(`${valid.length} alumno${valid.length > 1 ? "s" : ""} importado${valid.length > 1 ? "s" : ""}`);
            setShowBulkModal(false);
            setBulkText("");
            await loadData();
        } catch {
            toast.error("Error al importar alumnos");
        }
        setBulkImporting(false);
    }

    const groupTitle = group
        ? `${formatGrade(group.grade)} ${group.section}`
        : "Grupo";

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-28">
            <TopBar title={groupTitle} showBack />

            <main className="px-4 py-4">
                {/* Toolbar */}
                <div className="mb-4 space-y-2">
                    {/* Row 1: stats + primary action */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                            <Users size={15} className="text-[#8E8E8E]" />
                            <span className="font-semibold text-[#181818]">{activeCount}</span>
                            <span className="text-[#8E8E8E]">activos</span>
                            {inactiveCount > 0 && (
                                <span className="text-[#8E8E8E]">· {inactiveCount} baja{inactiveCount > 1 ? "s" : ""}</span>
                            )}
                        </div>
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-1.5 bg-[#BBF451] text-[#181818] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#AADE40] active:scale-95 transition-all"
                        >
                            <UserPlus size={16} />
                            Agregar
                        </button>
                    </div>

                    {/* Row 2: secondary actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 border border-[#E0E0E0] bg-white text-[#181818] px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#F5F5F5] active:scale-95 transition-all"
                        >
                            <Upload size={15} />
                            Importar en lote
                        </button>
                        {students.length > 0 && (
                            <button
                                onClick={openDeleteAllModal}
                                className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 bg-white text-red-500 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-50 active:scale-95 transition-all"
                            >
                                <Trash2 size={15} />
                                Eliminar todos
                            </button>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E8E]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar alumno..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#181818] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-2 focus:ring-[#BBF451] focus:border-transparent"
                    />
                </div>

                {/* Student List */}
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-white rounded-lg animate-pulse border border-[#E0E0E0]" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg border border-[#E0E0E0] text-center">
                        <Users size={32} className="mx-auto text-[#8E8E8E] mb-2" />
                        <p className="text-[#8E8E8E] text-sm">
                            {search ? "No se encontraron resultados" : "No hay alumnos en este grupo"}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-[#E0E0E0] divide-y divide-[#E0E0E0] overflow-hidden">
                        {filtered.map((student, idx) => (
                            <div
                                key={student.id}
                                className={`flex items-center px-4 py-3 gap-3 ${!student.active ? "opacity-50 bg-[#F5F5F5]" : ""}`}
                            >
                                <span className="text-xs font-mono text-[#8E8E8E] w-6 text-right shrink-0">
                                    {idx + 1}
                                </span>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#181818] truncate">
                                        {student.last_name}{" "}
                                        <span className="text-[#8E8E8E] font-normal">{student.first_name}</span>
                                    </p>
                                    {student.student_id_official && (
                                        <p className="text-xs text-[#8E8E8E]">{student.student_id_official}</p>
                                    )}
                                    {!student.active && (
                                        <span className="text-[10px] font-semibold text-red-500 uppercase">Baja</span>
                                    )}
                                </div>

                                {deletingId === student.id ? (
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-red-600 mr-1">¿Eliminar?</span>
                                        <button
                                            onClick={() => handleDelete(student.id)}
                                            className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(null)}
                                            className="p-1.5 rounded-md bg-[#F5F5F5] text-[#8E8E8E] hover:bg-[#E0E0E0]"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleToggleActive(student)}
                                            className={`p-1.5 rounded-md ${student.active ? "text-[#181818] hover:bg-[#BBF451]/20" : "text-[#8E8E8E] hover:bg-[#F5F5F5]"}`}
                                            title={student.active ? "Dar de baja" : "Reactivar"}
                                        >
                                            {student.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(student)}
                                            className="p-1.5 rounded-md text-[#8E8E8E] hover:bg-[#F5F5F5]"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(student.id)}
                                            className="p-1.5 rounded-md text-[#8E8E8E] hover:bg-red-50 hover:text-red-500"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav />

            {/* Modal — Add / Edit Student */}
            {showModal && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-[#181818]">
                                {editingStudent ? "Editar Alumno" : "Agregar Alumno"}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-md hover:bg-[#F5F5F5]">
                                <X size={20} className="text-[#8E8E8E]" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#181818] mb-1">Apellidos *</label>
                                <input
                                    type="text"
                                    value={formLastName}
                                    onChange={(e) => setFormLastName(e.target.value)}
                                    placeholder="Ej. García López"
                                    autoFocus
                                    className="w-full px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-sm text-[#181818] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-2 focus:ring-[#BBF451] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#181818] mb-1">Nombre(s) *</label>
                                <input
                                    type="text"
                                    value={formFirstName}
                                    onChange={(e) => setFormFirstName(e.target.value)}
                                    placeholder="Ej. María Fernanda"
                                    className="w-full px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-sm text-[#181818] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-2 focus:ring-[#BBF451] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#181818] mb-1">Matrícula</label>
                                <input
                                    type="text"
                                    value={formIdOfficial}
                                    onChange={(e) => setFormIdOfficial(e.target.value)}
                                    placeholder="Opcional"
                                    className="w-full px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-sm text-[#181818] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-2 focus:ring-[#BBF451] focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 rounded-lg border border-[#E0E0E0] text-sm font-medium text-[#181818] hover:bg-[#F5F5F5] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2.5 rounded-lg bg-[#BBF451] text-[#181818] text-sm font-semibold hover:bg-[#AADE40] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <div className="h-4 w-4 border-2 border-[#181818]/30 border-t-[#181818] rounded-full animate-spin" />
                                ) : (
                                    <Check size={16} />
                                )}
                                {editingStudent ? "Guardar" : "Agregar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal — Eliminar todos */}
            {showDeleteAllModal && (() => {
                const toDelete = students.filter((s) => !protectedIds.has(s.id));
                const protected_ = students.filter((s) => protectedIds.has(s.id));
                return (
                    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[85vh] flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Trash2 size={18} className="text-red-500" />
                                    <h3 className="text-lg font-bold text-[#181818]">Eliminar todos los alumnos</h3>
                                </div>
                                <button onClick={() => setShowDeleteAllModal(false)} className="p-1 rounded-md hover:bg-[#F5F5F5]">
                                    <X size={20} className="text-[#8E8E8E]" />
                                </button>
                            </div>

                            {!deleteAllReady ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="h-6 w-6 border-2 border-[#BBF451] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <>
                                    {/* Summary */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                            <Trash2 size={16} className="text-red-500 shrink-0" />
                                            <p className="text-sm text-red-700">
                                                <span className="font-bold">{toDelete.length} alumno{toDelete.length !== 1 ? "s" : ""}</span> {toDelete.length !== 1 ? "serán eliminados" : "será eliminado"}
                                            </p>
                                        </div>
                                        {protected_.length > 0 && (
                                            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                                <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                                <p className="text-sm text-amber-700">
                                                    <span className="font-bold">{protected_.length} alumno{protected_.length !== 1 ? "s" : ""}</span> no {protected_.length !== 1 ? "pueden eliminarse" : "puede eliminarse"} porque {protected_.length !== 1 ? "tienen" : "tiene"} reportes de conducta
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Protected list */}
                                    {protected_.length > 0 && (
                                        <div className="overflow-y-auto flex-1 mb-4">
                                            <p className="text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">Con reportes (no se eliminan)</p>
                                            <div className="rounded-xl border border-[#E0E0E0] divide-y divide-[#E0E0E0] overflow-hidden">
                                                {protected_.map((s) => (
                                                    <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                                                        <ShieldAlert size={13} className="text-amber-500 shrink-0" />
                                                        <p className="text-sm text-[#181818]">
                                                            {s.last_name} <span className="text-[#8E8E8E] font-normal">{s.first_name}</span>
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {toDelete.length === 0 ? (
                                        <p className="text-sm text-[#8E8E8E] text-center py-2 mb-4">
                                            Todos los alumnos tienen reportes y no pueden eliminarse.
                                        </p>
                                    ) : null}

                                    <div className="flex gap-3 shrink-0">
                                        <button
                                            onClick={() => setShowDeleteAllModal(false)}
                                            className="flex-1 py-2.5 rounded-lg border border-[#E0E0E0] text-sm font-medium text-[#181818] hover:bg-[#F5F5F5] transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleDeleteAll}
                                            disabled={deleteAllLoading || toDelete.length === 0}
                                            className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {deleteAllLoading ? (
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 size={15} />
                                            )}
                                            {deleteAllLoading ? "Eliminando..." : `Eliminar ${toDelete.length}`}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Modal — Carga en lote */}
            {showBulkModal && (() => {
                const parsed = bulkText.trim() ? parseBulkText(bulkText) : [];
                const validRows = parsed.filter((r): r is Extract<ParsedRow, { valid: true }> => r.valid);
                const invalidCount = parsed.length - validRows.length;
                return (
                    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[85vh] flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-[#181818]">Carga en lote</h3>
                                <button onClick={() => setShowBulkModal(false)} className="p-1 rounded-md hover:bg-[#F5F5F5]">
                                    <X size={20} className="text-[#8E8E8E]" />
                                </button>
                            </div>

                            <p className="text-xs text-[#8E8E8E] mb-3">
                                Pega la lista del Excel. Formato:{" "}
                                <span className="font-mono bg-[#F5F5F5] px-1 rounded">APELLIDO1 APELLIDO2 NOMBRE(S)</span>
                            </p>

                            <textarea
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                placeholder={"AGUILAR CAMACHO MELISSA JATZITI\nALDANA MORALES YAZMIN\n..."}
                                rows={6}
                                className="w-full px-3 py-2.5 rounded-lg border border-[#E0E0E0] text-sm font-mono text-[#181818] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-2 focus:ring-[#BBF451] focus:border-transparent resize-none"
                            />

                            {parsed.length > 0 && (
                                <div className="mt-3 overflow-y-auto flex-1">
                                    <p className="text-xs font-semibold text-[#8E8E8E] mb-2">
                                        Vista previa — {validRows.length} válidos{invalidCount > 0 ? `, ${invalidCount} con error` : ""}
                                    </p>
                                    <div className="rounded-lg border border-[#E0E0E0] divide-y divide-[#E0E0E0] overflow-hidden">
                                        {parsed.map((row, i) =>
                                            row.valid ? (
                                                <div key={i} className="flex gap-2 px-3 py-2 text-xs">
                                                    <span className="text-[#181818] font-medium w-36 truncate shrink-0">{row.last_name}</span>
                                                    <span className="text-[#8E8E8E]">{row.first_name}</span>
                                                </div>
                                            ) : (
                                                <div key={i} className="flex gap-2 px-3 py-2 text-xs bg-red-50">
                                                    <span className="text-red-500 font-mono truncate">{row.raw}</span>
                                                    <span className="text-red-400 shrink-0">← inválido</span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-4 shrink-0">
                                <button
                                    onClick={() => setShowBulkModal(false)}
                                    className="flex-1 py-2.5 rounded-lg border border-[#E0E0E0] text-sm font-medium text-[#181818] hover:bg-[#F5F5F5] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBulkImport}
                                    disabled={bulkImporting || validRows.length === 0}
                                    className="flex-1 py-2.5 rounded-lg bg-[#BBF451] text-[#181818] text-sm font-semibold hover:bg-[#AADE40] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {bulkImporting ? (
                                        <div className="h-4 w-4 border-2 border-[#181818]/30 border-t-[#181818] rounded-full animate-spin" />
                                    ) : (
                                        <Check size={16} />
                                    )}
                                    {bulkImporting ? "Importando..." : `Importar ${validRows.length} alumno${validRows.length !== 1 ? "s" : ""}`}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
