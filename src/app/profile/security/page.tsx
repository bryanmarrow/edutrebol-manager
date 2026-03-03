"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { ShieldCheck, KeyRound, Smartphone } from "lucide-react";

const SECURITY_KEY = "edutrebol.security.biometric";

export default function ProfileSecurityPage() {
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    useEffect(() => {
        const stored = window.localStorage.getItem(SECURITY_KEY);
        setBiometricEnabled(stored === "enabled");
    }, []);

    function toggleBiometric() {
        setBiometricEnabled((prev) => {
            const next = !prev;
            window.localStorage.setItem(SECURITY_KEY, next ? "enabled" : "disabled");
            return next;
        });
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-10">
            <TopBar title="Seguridad" showBack />

            <main className="p-4 space-y-4">
                <section className="bg-white border border-[#E0E0E0] rounded-2xl p-4 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-[#F5F5F5] rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-[#181818]" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-[#181818]">Protección de la cuenta</h2>
                            <p className="text-sm text-[#8E8E8E]">Administra opciones de acceso seguro en este dispositivo.</p>
                        </div>
                    </div>

                    <div className="border border-[#E0E0E0] rounded-xl overflow-hidden divide-y divide-[#E0E0E0]">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <KeyRound className="w-5 h-5 text-[#181818]" />
                                <span className="text-sm text-[#181818] font-medium">Cambiar contraseña</span>
                            </div>
                            <span className="text-xs text-[#8E8E8E]">Próximamente</span>
                        </div>
                        <button onClick={toggleBiometric} className="w-full flex items-center justify-between p-4 active:bg-[#F5F5F5]">
                            <div className="flex items-center gap-3">
                                <Smartphone className="w-5 h-5 text-[#181818]" />
                                <span className="text-sm text-[#181818] font-medium">Bloqueo biométrico</span>
                            </div>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${biometricEnabled ? "bg-[#BBF451]" : "bg-[#E0E0E0]"}`}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all ${biometricEnabled ? "left-5" : "left-1"}`} />
                            </div>
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}
