"use client";

import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FileText, Download, Filter } from "lucide-react";

export default function ReportsPage() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-28">
            <TopBar title="Reportes" />

            <main className="p-4 space-y-6">

                {/* Generator Card */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#E0E0E0]">
                    <h2 className="text-lg font-bold text-[#181818] mb-4">Generar Reporte Mensual</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#8E8E8E] uppercase mb-1.5 ml-1">Mes</label>
                            <select className="w-full h-12 px-4 rounded-xl bg-[#F5F5F5] border-r-8 border-transparent outline outline-1 outline-[#E0E0E0] focus:outline-[#BBF451] text-[#181818] font-medium">
                                <option>Febrero 2026</option>
                                <option>Enero 2026</option>
                                <option>Diciembre 2025</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#8E8E8E] uppercase mb-1.5 ml-1">Grupo</label>
                            <select className="w-full h-12 px-4 rounded-xl bg-[#F5F5F5] border-r-8 border-transparent outline outline-1 outline-[#E0E0E0] focus:outline-[#BBF451] text-[#181818] font-medium">
                                <option>2° B - Matemáticas I</option>
                                <option>3° A - Física II</option>
                                <option>1° C - Matemáticas III</option>
                            </select>
                        </div>

                        <button className="w-full h-12 bg-[#BBF451] hover:bg-[#AADE40] active:scale-[0.98] transition-all text-[#181818] font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#BBF451]/20">
                            <FileText className="w-5 h-5" />
                            Generar PDF
                        </button>
                    </div>
                </section>

                {/* History */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-base font-bold text-[#181818]">Historial Reciente</h3>
                        <button className="text-[#181818] text-sm font-medium hover:text-[#BBF451] transition-colors">Ver todos</button>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#E0E0E0] divide-y divide-[#E0E0E0] overflow-hidden">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 flex items-center justify-between active:bg-[#F5F5F5]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#181818]">Reporte Enero 2026</p>
                                        <p className="text-xs text-[#8E8E8E]">2° B • Generado 01 Feb</p>
                                    </div>
                                </div>
                                <button className="p-2 text-[#8E8E8E] hover:text-[#181818] transition-colors">
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

            </main>

            <BottomNav />
        </div>
    );
}
