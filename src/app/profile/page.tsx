"use client";

import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { User, Settings, LogOut, Moon, Bell, Shield, ChevronRight } from "lucide-react";

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-28">
            <TopBar title="Perfil" showBack={false} />

            <main className="p-4 space-y-6">

                {/* User Card */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#E0E0E0] flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-[#BBF451] text-[#181818] rounded-full flex items-center justify-center mb-3">
                        <User className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-bold text-[#181818]">Prof. Juan Pérez</h2>
                    <p className="text-sm text-[#8E8E8E] font-medium">Matemáticas y Física</p>
                    <div className="mt-4 flex gap-2">
                        <span className="px-3 py-1 bg-[#BBF451]/20 text-[#181818] rounded-full text-xs font-bold">
                            Online
                        </span>
                        <span className="px-3 py-1 bg-[#F5F5F5] text-[#8E8E8E] rounded-full text-xs font-bold border border-[#E0E0E0]">
                            v1.0.0
                        </span>
                    </div>
                </section>

                {/* Settings Group */}
                <section className="space-y-3">
                    <h3 className="px-1 text-xs font-bold text-[#8E8E8E] uppercase tracking-wider">Configuración</h3>

                    <div className="bg-white rounded-2xl border border-[#E0E0E0] divide-y divide-[#E0E0E0] overflow-hidden">
                        <button className="w-full flex items-center justify-between p-4 active:bg-[#F5F5F5] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#F5F5F5] rounded-lg text-[#181818]">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-[#181818]">Notificaciones</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[#8E8E8E]" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 active:bg-[#F5F5F5] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#F5F5F5] rounded-lg text-[#181818]">
                                    <Moon className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-[#181818]">Modo Oscuro</span>
                            </div>
                            <div className="w-10 h-6 bg-[#E0E0E0] rounded-full relative">
                                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm" />
                            </div>
                        </button>
                        <button className="w-full flex items-center justify-between p-4 active:bg-[#F5F5F5] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#F5F5F5] rounded-lg text-[#181818]">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-[#181818]">Seguridad</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[#8E8E8E]" />
                        </button>
                    </div>
                </section>

                {/* Logout */}
                <button className="w-full bg-rose-50 text-rose-600 font-bold p-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
                    <LogOut className="w-5 h-5" />
                    Cerrar Sesión
                </button>

            </main>

            <BottomNav />
        </div>
    );
}
