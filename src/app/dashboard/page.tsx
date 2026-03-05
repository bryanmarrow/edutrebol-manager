"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ClassCard } from "@/components/ClassCard";
import { getTodayClasses, getCurrentTeacher } from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import type { ClassGroup } from "@/types";
import { CalendarOff, Clock, Users, X } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const router = useRouter();
    const [todayClasses, setTodayClasses] = useState<ClassGroup[]>([]);
    const [teacherName, setTeacherName] = useState("Profesor");
    const [loading, setLoading] = useState(true);
    const [confirmClass, setConfirmClass] = useState<ClassGroup | null>(null);

    useEffect(() => {
        async function load() {
            const [teacher, today] = await Promise.all([
                getCurrentTeacher(),
                getTodayClasses(),
            ]);
            if (teacher?.full_name) setTeacherName(teacher.full_name);
            setTodayClasses(today);
            setLoading(false);
        }
        load();
    }, []);

    function handleConfirm() {
        if (!confirmClass) return;
        router.push(`/classes/${confirmClass.id}/session/today`);
        setConfirmClass(null);
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-28">
            <TopBar userName={teacherName} />

            <main className="px-4 py-6">
                <section className="mb-6">
                    <h2 className="text-sm font-bold text-[#8E8E8E] uppercase tracking-wider mb-3">
                        Clases de Hoy
                    </h2>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-24 bg-white rounded-lg animate-pulse border border-[#E0E0E0]" />
                            ))}
                        </div>
                    ) : todayClasses.length === 0 ? (
                        <div className="bg-white p-8 rounded-lg border border-[#E0E0E0] text-center">
                            <CalendarOff size={32} className="mx-auto text-[#8E8E8E] mb-2" />
                            <p className="text-[#8E8E8E] text-sm mb-3">
                                No tienes clases programadas para hoy.
                            </p>
                            <Link
                                href="/schedule"
                                className="text-[#181818] font-medium hover:text-[#BBF451] text-sm transition-colors"
                            >
                                Configurar mi horario →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todayClasses.map((cls) => {
                                const jsDay = new Date().getDay();
                                const todaySlot = cls.schedule?.find((s) => s.days.includes(jsDay));
                                return (
                                    <ClassCard
                                        key={cls.id}
                                        id={cls.id}
                                        name={cls.name}
                                        group={`${formatGrade(cls.grade)} ${cls.section}`}
                                        startTime={todaySlot?.start_time || "--:--"}
                                        endTime={todaySlot?.end_time || "--:--"}
                                        status="pending"
                                        studentCount={cls.student_count || 0}
                                        onSelect={() => setConfirmClass(cls)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-[#8E8E8E] uppercase tracking-wider">
                            Avisos
                        </h2>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E0E0E0]">
                        <p className="text-sm text-[#181818]">
                            Recuerda subir las calificaciones del parcial antes del viernes.
                        </p>
                    </div>
                </section>
            </main>

            <BottomNav />

            {/* Confirmation sheet */}
            {confirmClass && (() => {
                const jsDay = new Date().getDay();
                const slot = confirmClass.schedule?.find((s) => s.days.includes(jsDay));
                return (
                    <>
                        <div className="fixed inset-0 bg-black/40 z-[1000]" onClick={() => setConfirmClass(null)} />
                        <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
                            {/* Handle */}
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-1.5 rounded-full bg-[#E0E0E0]" />
                            </div>

                            <div className="flex items-start justify-between mb-5">
                                <p className="text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide">
                                    ¿Tomar asistencia de esta clase?
                                </p>
                                <button
                                    onClick={() => setConfirmClass(null)}
                                    className="p-1 rounded-full text-[#8E8E8E] hover:bg-[#F5F5F5] -mt-1 -mr-1"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Class details */}
                            <div className="bg-[#F5F5F5] rounded-2xl p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#BBF451] text-[#181818]">
                                        {formatGrade(confirmClass.grade)} {confirmClass.section}
                                    </span>
                                    {slot && (
                                        <span className="text-xs text-[#8E8E8E] flex items-center gap-1">
                                            <Clock size={12} /> {slot.start_time} – {slot.end_time}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xl font-bold text-[#181818]">{confirmClass.name}</p>
                                <p className="text-sm text-[#8E8E8E] flex items-center gap-1 mt-1">
                                    <Users size={13} /> {confirmClass.student_count ?? 0} alumnos
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmClass(null)}
                                    className="flex-1 py-3 rounded-xl border border-[#E0E0E0] text-sm font-semibold text-[#8E8E8E] hover:bg-[#F5F5F5] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 py-3 rounded-xl bg-[#BBF451] text-[#181818] text-sm font-bold active:scale-[0.98] transition-all"
                                >
                                    Sí, tomar asistencia
                                </button>
                            </div>
                        </div>
                    </>
                );
            })()}
        </div>
    );
}
