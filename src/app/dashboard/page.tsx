"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ClassCard } from "@/components/ClassCard";
import { getTodayClasses, getTeacherClasses, getCurrentTeacher } from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import type { ClassGroup } from "@/types";
import { CalendarOff } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const [todayClasses, setTodayClasses] = useState<ClassGroup[]>([]);
    const [teacherName, setTeacherName] = useState("Profesor");
    const [loading, setLoading] = useState(true);

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
                            {todayClasses.map((cls) => (
                                <ClassCard
                                    key={cls.id}
                                    id={cls.id}
                                    name={cls.name}
                                    group={`${formatGrade(cls.grade)} ${cls.section}`}
                                    startTime={cls.schedule?.start_time || "--:--"}
                                    endTime={cls.schedule?.end_time || "--:--"}
                                    status="pending"
                                    studentCount={cls.student_count || 0}
                                />
                            ))}
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
        </div>
    );
}
