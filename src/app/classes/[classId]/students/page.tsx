"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import {
    getClassInfo,
    getAllStudentsByClass,
    createStudent,
    updateStudent,
    deleteStudent,
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
} from "lucide-react";

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    student_id_official: string | null;
    active: boolean;
    class_id: string;
}

export default function StudentsPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;

    const [students, setStudents] = useState<Student[]>([]);
    const [classInfo, setClassInfo] = useState<{ name: string; grade: number; section: string } | null>(null);
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

    const loadData = useCallback(async () => {
        const [info, data] = await Promise.all([
            getClassInfo(classId),
            getAllStudentsByClass(classId),
        ]);
        if (info) setClassInfo(info);
        setStudents(data);
        setLoading(false);
    }, [classId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter students
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

    // Open modal for adding
    const openAddModal = () => {
        setEditingStudent(null);
        setFormFirstName("");
        setFormLastName("");
        setFormIdOfficial("");
        setShowModal(true);
    };

    // Open modal for editing
    const openEditModal = (student: Student) => {
        setEditingStudent(student);
        setFormFirstName(student.first_name);
        setFormLastName(student.last_name);
        setFormIdOfficial(student.student_id_official || "");
        setShowModal(true);
    };

    // Save (create or update)
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
                await createStudent(classId, {
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

    // Toggle active
    const handleToggleActive = async (student: Student) => {
        try {
            await updateStudent(student.id, { active: !student.active });
            await loadData();
            toast.success(student.active ? "Alumno dado de baja" : "Alumno reactivado");
        } catch {
            toast.error("Error al cambiar estado");
        }
    };

    // Delete
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

    return (
        <div className="min-h-screen bg-slate-50 pb-28">
            <Toaster position="top-center" richColors />
            <TopBar title={classInfo ? `${classInfo.name} — ${formatGrade(classInfo.grade)} ${classInfo.section}` : "Alumnos"} showBack />

            <main className="px-4 py-4">
                {/* Stats bar */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Users size={16} />
                        <span className="font-semibold">{activeCount}</span>
                        <span className="text-slate-400">activos</span>
                    </div>
                    {inactiveCount > 0 && (
                        <div className="text-sm text-slate-400">
                            · {inactiveCount} baja{inactiveCount > 1 ? "s" : ""}
                        </div>
                    )}
                    <div className="flex-1" />
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        <UserPlus size={16} />
                        Agregar
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar alumno..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                {/* Student List */}
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-white rounded-lg animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg border border-slate-100 text-center">
                        <Users size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 text-sm">
                            {search ? "No se encontraron resultados" : "No hay alumnos registrados"}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                        {filtered.map((student, idx) => (
                            <div
                                key={student.id}
                                className={`flex items-center px-4 py-3 gap-3 ${!student.active ? "opacity-50 bg-slate-50" : ""}`}
                            >
                                {/* Number */}
                                <span className="text-xs font-mono text-slate-400 w-6 text-right shrink-0">
                                    {idx + 1}
                                </span>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                        {student.last_name}{" "}
                                        <span className="text-slate-600 font-normal">{student.first_name}</span>
                                    </p>
                                    {student.student_id_official && (
                                        <p className="text-xs text-slate-400">{student.student_id_official}</p>
                                    )}
                                    {!student.active && (
                                        <span className="text-[10px] font-semibold text-red-500 uppercase">Baja</span>
                                    )}
                                </div>

                                {/* Actions */}
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
                                            className="p-1.5 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleToggleActive(student)}
                                            className={`p-1.5 rounded-md ${student.active ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"}`}
                                            title={student.active ? "Dar de baja" : "Reactivar"}
                                        >
                                            {student.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(student)}
                                            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(student.id)}
                                            className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500"
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
                    <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingStudent ? "Editar Alumno" : "Agregar Alumno"}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-md hover:bg-slate-100">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Apellidos *</label>
                                <input
                                    type="text"
                                    value={formLastName}
                                    onChange={(e) => setFormLastName(e.target.value)}
                                    placeholder="Ej. García López"
                                    autoFocus
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre(s) *</label>
                                <input
                                    type="text"
                                    value={formFirstName}
                                    onChange={(e) => setFormFirstName(e.target.value)}
                                    placeholder="Ej. María Fernanda"
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
                                <input
                                    type="text"
                                    value={formIdOfficial}
                                    onChange={(e) => setFormIdOfficial(e.target.value)}
                                    placeholder="Opcional"
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Check size={16} />
                                )}
                                {editingStudent ? "Guardar" : "Agregar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
