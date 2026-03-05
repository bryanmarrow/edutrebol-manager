"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { toast } from "sonner";
import { LogOut, Moon, Bell, Shield, ChevronRight, Loader2, Pencil, Check, X, User, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCurrentTeacher, updateTeacherName } from "@/lib/queries";

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
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [savingName, setSavingName] = useState(false);

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
                    setLoading(false);
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

    function openEditName() {
        setNameInput(teacher?.full_name ?? "");
        setEditingName(true);
    }

    async function handleSaveName() {
        if (!nameInput.trim()) return;
        setSavingName(true);
        try {
            await updateTeacherName(nameInput.trim());
            setTeacher((t) => t ? { ...t, full_name: nameInput.trim() } : t);
            setEditingName(false);
            toast.success("Nombre actualizado");
        } catch {
            toast.error("Error al guardar el nombre");
        }
        setSavingName(false);
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

    const fullName = teacher?.full_name?.trim() || "Sin nombre";

    const card = isDarkMode
        ? "bg-[#181818] border-[#2A2A2A]"
        : "bg-white border-[#E0E0E0]";
    const divider = isDarkMode ? "divide-[#2A2A2A]" : "divide-[#E0E0E0]";
    const textPrimary = isDarkMode ? "text-white" : "text-[#181818]";
    const textSecondary = isDarkMode ? "text-[#A3A3A3]" : "text-[#8E8E8E]";
    const iconBg = isDarkMode ? "bg-[#202020] text-white" : "bg-[#F5F5F5] text-[#181818]";
    const activeRow = isDarkMode ? "active:bg-[#202020]" : "active:bg-[#F5F5F5]";

    return (
        <div className={`min-h-screen pb-28 transition-colors ${isDarkMode ? "bg-[#101010]" : "bg-[#F5F5F5]"}`}>
            <TopBar title="Perfil" showBack={false} userName={fullName} />

            <main className="p-4 space-y-6">
                {/* Avatar */}
                <section className={`rounded-2xl p-6 shadow-sm border flex flex-col items-center text-center ${card}`}>
                    <div className="w-20 h-20 bg-[#BBF451] text-[#181818] rounded-full flex items-center justify-center mb-3">
                        {loading
                            ? <Loader2 className="w-8 h-8 animate-spin" />
                            : <span className="text-3xl font-bold">{initials}</span>
                        }
                    </div>
                    <h2 className={`text-xl font-bold ${textPrimary}`}>
                        {loading ? "Cargando..." : fullName}
                    </h2>
                    <p className={`text-sm ${textSecondary}`}>
                        {loading ? "" : teacher?.email}
                    </p>
                </section>

                {/* Mis datos */}
                <section className="space-y-3">
                    <h3 className={`px-1 text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Mis datos</h3>
                    <div className={`rounded-2xl border divide-y overflow-hidden ${card} ${divider}`}>
                        {/* Nombre */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-lg ${iconBg}`}>
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className={`text-sm font-medium ${textPrimary}`}>Nombre</span>
                                </div>
                                {!loading && !editingName && (
                                    <button
                                        onClick={openEditName}
                                        className={`flex items-center gap-1 text-xs font-medium text-[#BBF451] px-2 py-1 rounded-lg hover:bg-[#BBF451]/10 transition-colors`}
                                    >
                                        <Pencil size={12} />
                                        Editar
                                    </button>
                                )}
                            </div>
                            {editingName ? (
                                <div className="mt-2 flex items-center gap-2">
                                    <input
                                        autoFocus
                                        value={nameInput}
                                        onChange={(e) => setNameInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSaveName();
                                            if (e.key === "Escape") setEditingName(false);
                                        }}
                                        placeholder="Ej. Juan Pérez García"
                                        className="flex-1 px-3 py-2 rounded-lg border border-[#E0E0E0] text-sm text-[#181818] focus:outline-none focus:ring-2 focus:ring-[#BBF451]"
                                    />
                                    <button
                                        onClick={handleSaveName}
                                        disabled={savingName || !nameInput.trim()}
                                        className="p-2 rounded-lg bg-[#BBF451] text-[#181818] disabled:opacity-50"
                                    >
                                        {savingName ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                    </button>
                                    <button
                                        onClick={() => setEditingName(false)}
                                        className={`p-2 rounded-lg ${isDarkMode ? "bg-[#2A2A2A] text-[#A3A3A3]" : "bg-[#F5F5F5] text-[#8E8E8E]"}`}
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            ) : (
                                <p className={`text-sm pl-10 ${loading ? textSecondary : teacher?.full_name ? textPrimary : "text-amber-500 font-medium"}`}>
                                    {loading ? "Cargando..." : teacher?.full_name ?? "Sin nombre — toca Editar para agregar"}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`p-2 rounded-lg ${iconBg}`}>
                                    <Mail className="w-4 h-4" />
                                </div>
                                <span className={`text-sm font-medium ${textPrimary}`}>Correo electrónico</span>
                            </div>
                            <p className={`text-sm pl-10 ${textSecondary}`}>
                                {loading ? "Cargando..." : teacher?.email}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Configuración */}
                <section className="space-y-3">
                    <h3 className={`px-1 text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Configuración</h3>
                    <div className={`rounded-2xl border divide-y overflow-hidden ${card} ${divider}`}>
                        <button onClick={toggleNotifications} className={`w-full flex items-center justify-between p-4 transition-colors ${activeRow}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${iconBg}`}>
                                    <Bell className="w-5 h-5" />
                                </div>
                                <span className={`text-sm font-medium ${textPrimary}`}>
                                    Notificaciones
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs ${textSecondary}`}>{notificationsEnabled ? "Activadas" : "Desactivadas"}</span>
                                <div className={`w-10 h-6 rounded-full relative transition-colors ${notificationsEnabled ? "bg-[#BBF451]" : isDarkMode ? "bg-[#383838]" : "bg-[#E0E0E0]"}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all ${notificationsEnabled ? "left-5" : "left-1"}`} />
                                </div>
                            </div>
                        </button>

                        <button onClick={toggleDarkMode} className={`w-full flex items-center justify-between p-4 transition-colors ${activeRow}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${iconBg}`}>
                                    <Moon className="w-5 h-5" />
                                </div>
                                <span className={`text-sm font-medium ${textPrimary}`}>Modo Oscuro</span>
                            </div>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${isDarkMode ? "bg-[#BBF451]" : "bg-[#E0E0E0]"}`}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all ${isDarkMode ? "left-5" : "left-1"}`} />
                            </div>
                        </button>

                        <Link href="/profile/security" className={`w-full flex items-center justify-between p-4 transition-colors ${activeRow}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${iconBg}`}>
                                    <Shield className="w-5 h-5" />
                                </div>
                                <span className={`text-sm font-medium ${textPrimary}`}>Seguridad</span>
                            </div>
                            <ChevronRight className={`w-5 h-5 ${textSecondary}`} />
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
