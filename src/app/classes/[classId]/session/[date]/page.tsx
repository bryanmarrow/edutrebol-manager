"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { SessionHeader } from "@/components/session/SessionHeader";
import { SessionFooter } from "@/components/session/SessionFooter";
import { StudentRow } from "@/components/StudentRow";
import { StudentWithStatus } from "@/types";
import { useAttendance } from "@/hooks/useAttendance";
import {
    getStudentsByClass,
    getOrCreateSession,
    getAttendanceRecords,
    saveAttendanceRecords,
    getClassInfo,
} from "@/lib/queries";

export default function AttendanceSessionPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;
    const dateParam = params.date as string;

    const [initialData, setInitialData] = useState<StudentWithStatus[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [sessionId, setSessionId] = useState<string>("");
    const [className, setClassName] = useState("");
    const [groupName, setGroupName] = useState("");

    // Resolve the actual date
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const sessionDate = dateParam === "today" ? today : dateParam;

    // 1. Fetch real data from Supabase
    useEffect(() => {
        async function load() {
            try {
                // Fetch class info, students, and session in parallel
                const [classInfo, students, session] = await Promise.all([
                    getClassInfo(classId),
                    getStudentsByClass(classId),
                    getOrCreateSession(classId, sessionDate),
                ]);

                if (classInfo) {
                    setClassName(classInfo.name);
                    setGroupName(`${classInfo.grade} ${classInfo.section}`);
                }

                if (session) {
                    setSessionId(session.id);

                    // Load existing attendance records if any
                    const records = await getAttendanceRecords(session.id);
                    if (records.length > 0) {
                        // Merge existing records with students
                        const recordMap = new Map(records.map((r: any) => [r.student_id, r.status]));
                        const merged = students.map((s) => ({
                            ...s,
                            status: (recordMap.get(s.id) as any) || "present",
                        }));
                        setInitialData(merged);
                    } else {
                        setInitialData(students);
                    }
                } else {
                    setInitialData(students);
                }
            } catch (err) {
                console.error("Error loading session data:", err);
                toast.error("Error al cargar datos");
            }
            setIsFetching(false);
        }
        load();
    }, [classId, sessionDate]);

    // 2. Use attendance hook (offline-first logic)
    const storageKey = `${classId}-${sessionDate}`;
    const {
        students,
        stats,
        hasUnsavedChanges,
        toggleStatus,
        clearLocalSave,
        isLoaded,
    } = useAttendance(storageKey, initialData);

    // 3. Save to Supabase
    const handleSave = async () => {
        if (!sessionId) {
            toast.error("No se pudo crear la sesión");
            return;
        }

        setIsSaving(true);
        try {
            const records = students.map((s) => ({
                student_id: s.id,
                status: s.status,
            }));

            await saveAttendanceRecords(sessionId, records);

            clearLocalSave();

            toast.success("Asistencia guardada correctamente", {
                description: `Se registraron ${stats.absent} faltas y ${stats.late} retardos.`,
                duration: 3000,
            });

            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (err) {
            toast.error("Error al guardar. Los datos se mantienen en local.");
        }
        setIsSaving(false);
    };

    if (isFetching || !isLoaded) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 bg-slate-200 rounded-full" />
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <p className="text-sm text-slate-400">Cargando alumnos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <Toaster position="top-center" richColors />

            <SessionHeader
                access_className={className || "Clase"}
                groupName={groupName || "Grupo"}
                totalStudents={stats.total}
                presentCount={stats.present}
                absentCount={stats.absent}
                lateCount={stats.late}
            />

            <main className="px-0">
                <div className="bg-white border-b border-slate-100 divide-y divide-slate-100">
                    {students.map((student) => (
                        <StudentRow
                            key={student.id}
                            student={student}
                            onToggle={toggleStatus}
                        />
                    ))}
                </div>
            </main>

            <SessionFooter
                onSave={handleSave}
                isSaving={isSaving}
                hasChanges={hasUnsavedChanges}
            />
        </div>
    );
}
