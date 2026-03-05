"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { getSharedGroupReports } from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS, REPORT_TYPES } from "@/lib/conductReports";
import type { ConductReport, ConductReportType } from "@/types";
import { ClipboardList, X } from "lucide-react";

export default function SharedReportPage() {
    const params = useParams();
    const token = params.token as string;

    const [reports, setReports] = useState<ConductReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [invalid, setInvalid] = useState(false);

    // Client-side filters
    const [filterType, setFilterType] = useState<ConductReportType | "">("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");

    useEffect(() => {
        getSharedGroupReports(token).then((data) => {
            if (data.length === 0) {
                // Token may be valid but empty, or invalid — check later
            }
            setReports(data);
            setLoading(false);
        }).catch(() => {
            setInvalid(true);
            setLoading(false);
        });
    }, [token]);

    const filtered = useMemo(() => {
        return reports.filter((r) => {
            if (filterType && r.type !== filterType) return false;
            if (filterFrom && r.date < filterFrom) return false;
            if (filterTo && r.date > filterTo) return false;
            return true;
        });
    }, [reports, filterType, filterFrom, filterTo]);

    function formatDate(dateStr: string) {
        return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    // Derive group info from first report
    const groupInfo = reports[0] ? {
        grade: reports[0].group_grade,
        section: reports[0].group_section,
    } : null;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
                <div className="h-8 w-8 border-2 border-[#BBF451] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (invalid) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-6">
                <div className="bg-white rounded-xl border border-[#E0E0E0] p-8 text-center max-w-sm w-full">
                    <X size={32} className="mx-auto text-rose-400 mb-3" />
                    <p className="text-sm font-semibold text-[#181818] mb-1">Link no válido</p>
                    <p className="text-xs text-[#8E8E8E]">Este link de compartición no existe o ha expirado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5]">
            {/* Header */}
            <header className="bg-[#181818] px-4 pt-safe pb-4 pt-4">
                <p className="text-xs text-[#8E8E8E] mb-0.5">Bitácora de conducta</p>
                <h1 className="text-xl font-bold text-white">
                    {groupInfo ? `${formatGrade(groupInfo.grade!)} ${groupInfo.section}` : "Grupo"}
                </h1>
                <p className="text-xs text-[#8E8E8E] mt-1">{reports.length} incidente{reports.length !== 1 ? "s" : ""} registrado{reports.length !== 1 ? "s" : ""}</p>
            </header>

            <main className="px-4 py-4 space-y-4">
                {/* Filters */}
                <div className="bg-white rounded-xl border border-[#E0E0E0] p-4 space-y-3">
                    {/* Type chips */}
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setFilterType("")}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                filterType === "" ? "bg-[#181818] text-white" : "bg-[#F5F5F5] text-[#8E8E8E] hover:bg-[#E0E0E0]"
                            }`}
                        >
                            Todos
                        </button>
                        {REPORT_TYPES.map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(filterType === type ? "" : type)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                    filterType === type
                                        ? "bg-[#181818] text-white"
                                        : `${REPORT_TYPE_COLORS[type]} hover:opacity-80`
                                }`}
                            >
                                {REPORT_TYPE_LABELS[type]}
                            </button>
                        ))}
                    </div>

                    {/* Date range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">Desde</label>
                            <input
                                type="date"
                                value={filterFrom}
                                onChange={(e) => setFilterFrom(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-[#E0E0E0] text-xs text-[#181818] focus:outline-none focus:ring-2 focus:ring-[#BBF451]"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">Hasta</label>
                            <input
                                type="date"
                                value={filterTo}
                                onChange={(e) => setFilterTo(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-[#E0E0E0] text-xs text-[#181818] focus:outline-none focus:ring-2 focus:ring-[#BBF451]"
                            />
                        </div>
                    </div>

                    {(filterType || filterFrom || filterTo) && (
                        <button
                            onClick={() => { setFilterType(""); setFilterFrom(""); setFilterTo(""); }}
                            className="flex items-center gap-1.5 text-xs text-[#8E8E8E] hover:text-[#181818] transition-colors"
                        >
                            <X size={12} /> Limpiar filtros
                        </button>
                    )}
                </div>

                {/* Count after filter */}
                <p className="text-xs text-[#8E8E8E] px-1">
                    {filtered.length} de {reports.length} incidente{reports.length !== 1 ? "s" : ""}
                </p>

                {/* List */}
                {filtered.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-[#E0E0E0] text-center">
                        <ClipboardList size={32} className="mx-auto text-[#8E8E8E] mb-2" />
                        <p className="text-[#8E8E8E] text-sm">No hay reportes con estos filtros</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((r) => (
                            <div key={r.id} className="bg-white rounded-xl border border-[#E0E0E0] p-4">
                                <div className="flex items-start gap-3">
                                    <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${REPORT_TYPE_COLORS[r.type]}`}>
                                        {REPORT_TYPE_LABELS[r.type]}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#181818] truncate">
                                            {r.student_last_name} {r.student_first_name}
                                        </p>
                                        {r.notes && (
                                            <p className="text-xs text-[#8E8E8E] mt-0.5">{r.notes}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#8E8E8E]">
                                            <span>{formatDate(r.date)}</span>
                                            <span>· {r.teacher_name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="px-4 py-6 text-center">
                <p className="text-[10px] text-[#8E8E8E]">Generado por Asistencia Secu</p>
            </footer>
        </div>
    );
}
