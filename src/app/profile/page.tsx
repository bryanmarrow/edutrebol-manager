"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { LogOut, Moon, Bell, Shield, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCurrentTeacher } from "@/lib/queries";

interface TeacherProfile {
    id: string;
    email: string;
    full_name: string | null;
}

const THEME_KEY = "edutrebol.theme";
const NOTIFICATIONS_KEY = "edutrebol.notifications";

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    useEffect(() => {
        const storedTheme = window.localStorage.getItem(THEME_KEY);
        const prefersDark = storedTheme === "dark";
        setIsDarkMode(prefersDark);
        document.documentElement.classList.toggle("dark", prefersDark);

        const storedNotifications = window.localStorage.getItem(NOTIFICATIONS_KEY);
        if (storedNotifications !== null) {
            setNotificationsEnabled(storedNotifications === "enabled");
        }
    }, []);

    useEffect(() => {
        async function loadProfile() {
            try {
                const { data } = await supabase.auth.getSession();
                if (!data.session) {
                    router.replace("/login");
                    return;
                }

                const currentTeacher = await getCurrentTeacher();
                if (!currentTeacher) {
                    router.replace("/login");
                    return;
                }

                setTeacher(currentTeacher);
            } catch (err) {
                console.error("Error loading profile:", err);
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [router]);

    function toggleDarkMode() {
        setIsDarkMode((prev) => {
            const next = !prev;
            document.documentElement.classList.toggle("dark", next);
            window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
            return next;
        });
    }

    function toggleNotifications() {
        setNotificationsEnabled((prev) => {
            const next = !prev;
            window.localStorage.setItem(NOTIFICATIONS_KEY, next ? "enabled" : "disabled");
            return next;
        });
    }

    async function handleLogout() {
        setLoggingOut(true);
        await supabase.auth.signOut();
        router.replace("/login");
    }

    const initials = useMemo(() => {
        const source = teacher?.full_name || teacher?.email || "P";
        return source.trim().charAt(0).toUpperCase();
    }, [teacher]);

    const fullName = teacher?.full_name?.trim() || "Profesor";

    return (
        <div className={`min-h-screen pb-28 transition-colors ${isDarkMode ? "bg-[#101010]" : "bg-[#F5F5F5]"}`}>
            <TopBar title="Perfil" showBack={false} userName={fullName} />

            <main className="p-4 space-y-6">
                <section className={`rounded-2xl p-6 shadow-sm border flex flex-col items-center text-center ${isDarkMode ? "bg-[#181818] border-[#2A2A2A]" : "bg-white border-[#E0E0E0]"}`}>
                    <div className="w-20 h-20 bg-[#BBF451] text-[#181818] rounded-full flex items-center justify-center mb-3">
                        {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <span className="text-3xl font-bold">{initials}</span>}
                    </div>
                    <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-[#181818]"}`}>{loading ? "Cargando perfil..." : fullName}</h2>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-[#A3A3A3]" : "text-[#8E8E8E]"}`}>
                        {loading ? "Sincronizando datos" : teacher?.email}
                    </p>
                    <div className="mt-4 flex gap-2">
                        <span className="px-3 py-1 bg-[#BBF451]/20 text-[#181818] rounded-full text-xs font-bold">
                            {loading ? "..." : "Online"}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isDarkMode ? "bg-[#202020] text-[#A3A3A3] border-[#2E2E2E]" : "bg-[#F5F5F5] text-[#8E8E8E] border-[#E0E0E0]"}`}>
                            v1.0.0
                        </span>
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className={`px-1 text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-[#A3A3A3]" : "text-[#8E8E8E]"}`}>Configuración</h3>

                    <div className={`rounded-2xl border divide-y overflow-hidden ${isDarkMode ? "bg-[#181818] border-[#2A2A2A] divide-[#2A2A2A]" : "bg-white border-[#E0E0E0] divide-[#E0E0E0]"}`}>
                        <button onClick={toggleNotifications} className={`w-full flex items-center justify-between p-4 transition-colors ${isDarkMode ? "active:bg-[#202020]" : "active:bg-[#F5F5F5]"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isDarkMode ? "bg-[#202020] text-white" : "bg-[#F5F5F5] text-[#181818]"}`}>
                                    <Bell className="w-5 h-5" />
                                </div>
                                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-[#181818]"}`}>
                                    Notificaciones ({notificationsEnabled ? "Activadas" : "Desactivadas"})
                                </span>
                            </div>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${notificationsEnabled ? "bg-[#BBF451]" : isDarkMode ? "bg-[#383838]" : "bg-[#E0E0E0]"}`}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all ${notificationsEnabled ? "left-5" : "left-1"}`} />
                            </div>
                        </button>

                        <button onClick={toggleDarkMode} className={`w-full flex items-center justify-between p-4 transition-colors ${isDarkMode ? "active:bg-[#202020]" : "active:bg-[#F5F5F5]"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isDarkMode ? "bg-[#202020] text-white" : "bg-[#F5F5F5] text-[#181818]"}`}>
                                    <Moon className="w-5 h-5" />
                                </div>
                                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-[#181818]"}`}>Modo Oscuro</span>
                            </div>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${isDarkMode ? "bg-[#BBF451]" : "bg-[#E0E0E0]"}`}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all ${isDarkMode ? "left-5" : "left-1"}`} />
                            </div>
                        </button>

                        <Link href="/profile/security" className={`w-full flex items-center justify-between p-4 transition-colors ${isDarkMode ? "active:bg-[#202020]" : "active:bg-[#F5F5F5]"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isDarkMode ? "bg-[#202020] text-white" : "bg-[#F5F5F5] text-[#181818]"}`}>
                                    <Shield className="w-5 h-5" />
                                </div>
                                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-[#181818]"}`}>Seguridad</span>
                            </div>
                            <ChevronRight className={`w-5 h-5 ${isDarkMode ? "text-[#A3A3A3]" : "text-[#8E8E8E]"}`} />
                        </Link>
                    </div>
                </section>

                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full bg-rose-50 text-rose-600 font-bold p-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors disabled:opacity-70"
                >
                    {loggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                    {loggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}
                </button>
            </main>

            <BottomNav />
        </div>
    );
}
