"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/layout/BottomNav";
import { CreateReportDrawer } from "@/components/CreateReportDrawer";
import { AttendanceStats } from "@/components/students/AttendanceStats";
import { AttendanceTrend } from "@/components/students/AttendanceTrend";
import { AttendanceByClass } from "@/components/students/AttendanceByClass";
import { ConductSummary } from "@/components/students/ConductSummary";
import {
    getStudentById,
    getStudentAttendanceStats,
    getStudentAttendanceTrend,
    getStudentAttendanceByClass,
    getConductReports,
} from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import type { ConductReport } from "@/types";

export default function StudentProfilePage() {
    const { studentId } = useParams<{ studentId: string }>();
    const router = useRouter();

    const [student, setStudent] = useState<Awaited<ReturnType<typeof getStudentById>>>(null);
    const [stats, setStats] = useState<Awaited<ReturnType<typeof getStudentAttendanceStats>> | null>(null);
    const [trend, setTrend] = useState<Awaited<ReturnType<typeof getStudentAttendanceTrend>>>([]);
    const [byClass, setByClass] = useState<Awaited<ReturnType<typeof getStudentAttendanceByClass>>>([]);
    const [reports, setReports] = useState<ConductReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        const [s, st, tr, bc, rp] = await Promise.all([
            getStudentById(studentId),
            getStudentAttendanceStats(studentId),
            getStudentAttendanceTrend(studentId),
            getStudentAttendanceByClass(studentId),
            getConductReports({ student_id: studentId }),
        ]);
        setStudent(s);
        setStats(st);
        setTrend(tr);
        setByClass(bc);
        setReports(rp);
        setLoading(false);
    }, [studentId]);

    useEffect(() => { loadData(); }, [loadData]);

    const studentName = student
        ? `${student.last_name} ${student.first_name}`
        : 'Alumno';

    const groupBadge = student?.group_grade && student?.group_section
        ? `${formatGrade(student.group_grade)} ${student.group_section}`
        : null;

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-28">
            {/* TopBar */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#E0E0E0] px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="p-1.5 -ml-1 rounded-lg text-[#181818] hover:bg-[#F5F5F5] transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-base font-bold text-[#181818] truncate">{studentName}</h1>
                    {groupBadge && (
                        <p className="text-xs text-[#8E8E8E]">{groupBadge}</p>
                    )}
                </div>
            </div>

            <main className="px-4 py-4 space-y-4 max-w-5xl mx-auto">
                {loading ? (
                    <>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-[#E0E0E0]" />
                            ))}
                        </div>
                        <div className="h-48 bg-white rounded-xl animate-pulse border border-[#E0E0E0]" />
                        <div className="h-32 bg-white rounded-xl animate-pulse border border-[#E0E0E0]" />
                        <div className="h-24 bg-white rounded-xl animate-pulse border border-[#E0E0E0]" />
                    </>
                ) : (
                    <>
                        {/* Asistencia */}
                        <div>
                            <p className="text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">Asistencia</p>
                            {stats && (
                                <div className="space-y-3">
                                    <AttendanceStats {...stats} />
                                    <AttendanceTrend data={trend} />
                                    <AttendanceByClass data={byClass} />
                                </div>
                            )}
                        </div>

                        {/* Conducta */}
                        <div>
                            <p className="text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">Conducta</p>
                            <ConductSummary reports={reports} />
                        </div>
                    </>
                )}
            </main>

            {/* FAB — crear reporte */}
            <button
                onClick={() => setDrawerOpen(true)}
                className="fixed bottom-24 right-4 z-20 w-14 h-14 rounded-full bg-[#181818] text-white shadow-lg flex items-center justify-center hover:bg-[#333] active:scale-95 transition-all"
                title="Nuevo reporte de conducta"
            >
                <ClipboardList size={22} />
            </button>

            <BottomNav />

            <CreateReportDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSaved={() => {
                    setDrawerOpen(false);
                    toast.success("Reporte guardado");
                    loadData();
                }}
                preselectedGroupId={student?.group_id}
                preselectedStudentId={studentId}
            />
        </div>
    );
}
