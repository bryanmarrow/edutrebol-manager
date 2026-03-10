"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, ClipboardList, ChevronRight, X } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { CreateReportDrawer } from "@/components/CreateReportDrawer";
import { getConductReports, getAllGroups, groupReportsByGroup, GroupedReports } from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS, REPORT_TYPES } from "@/lib/conductReports";
import type { ConductReportType, Group } from "@/types";

export default function ReportsPage() {
    const router = useRouter();
    const [grouped, setGrouped] = useState<GroupedReports[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [filterGroupId, setFilterGroupId] = useState<string>("");
    const [filterType, setFilterType] = useState<ConductReportType | "">("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");

    const loadReports = useCallback(async () => {
        setLoading(true);
        const data = await getConductReports({
            group_id: filterGroupId || undefined,
            type: filterType || undefined,
            from: filterFrom || undefined,
            to: filterTo || undefined,
        });
        setGrouped(groupReportsByGroup(data));
        setLoading(false);
    }, [filterGroupId, filterType, filterFrom, filterTo]);

    useEffect(() => { getAllGroups().then(setGroups); }, []);
    useEffect(() => { loadReports(); }, [loadReports]);

    const hasFilters = !!(filterGroupId || filterType || filterFrom || filterTo);
    const totalReports = grouped.reduce((s, g) => s + g.total, 0);

    // Global metrics
    const totalByType: Record<string, number> = {};
    for (const g of grouped) {
        for (const [type, count] of Object.entries(g.countByType)) {
            totalByType[type] = (totalByType[type] ?? 0) + count;
        }
    }
    const topGroup = grouped[0] ?? null;

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-28">
            <TopBar title="Reportes de Conducta" />

            <main className="px-4 py-4 space-y-4 max-w-5xl mx-auto">
                {/* Nuevo reporte */}
                <button
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl bg-[#BBF451] text-[#181818] font-semibold text-sm active:scale-[0.98] transition-transform shadow-sm"
                >
                    <Plus size={16} />
                    Nuevo reporte
                </button>

                {/* Metrics */}
                {!loading && totalReports > 0 && (
                    <div className="space-y-2">
                        {/* Top row: total + top group */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <div className="col-span-1 bg-[#181818] text-white rounded-xl px-4 py-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60 mb-0.5">Total</p>
                                <p className="text-2xl font-bold">{totalReports}</p>
                                <p className="text-[10px] text-white/60">{grouped.length} grupo{grouped.length !== 1 ? "s" : ""}</p>
                            </div>

                            {topGroup && (
                                <div className="col-span-1 bg-white border border-[#E0E0E0] rounded-xl px-4 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-0.5">Más reportes</p>
                                    <p className="text-base font-bold text-[#181818]">
                                        {formatGrade(topGroup.group_grade)} {topGroup.group_section}
                                    </p>
                                    <p className="text-[10px] text-[#8E8E8E]">{topGroup.total} reporte{topGroup.total !== 1 ? "s" : ""}</p>
                                </div>
                            )}

                            {/* Top 2 incident types */}
                            {REPORT_TYPES.filter((t) => totalByType[t]).slice(0, 2).map((t) => (
                                <div key={t} className={`col-span-1 rounded-xl px-4 py-3 ${REPORT_TYPE_COLORS[t].replace("text-", "border-").replace("bg-", "bg-")} border`}>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-0.5 truncate">
                                        {REPORT_TYPE_LABELS[t]}
                                    </p>
                                    <p className="text-2xl font-bold text-[#181818]">{totalByType[t]}</p>
                                    <p className="text-[10px] text-[#8E8E8E]">
                                        {Math.round((totalByType[t] / totalReports) * 100)}% del total
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Type breakdown bar */}
                        <div className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-2">Desglose por tipo</p>
                            <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-2">
                                {REPORT_TYPES.filter((t) => totalByType[t]).map((t) => (
                                    <div
                                        key={t}
                                        style={{ flex: totalByType[t] }}
                                        className={REPORT_TYPE_COLORS[t].split(" ")[0]}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {REPORT_TYPES.filter((t) => totalByType[t]).map((t) => (
                                    <div key={t} className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${REPORT_TYPE_COLORS[t].split(" ")[0]}`} />
                                        <span className="text-[10px] text-[#8E8E8E]">
                                            {REPORT_TYPE_LABELS[t]} <span className="font-semibold text-[#181818]">{totalByType[t]}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl border border-[#E0E0E0] p-4 space-y-3">
                    <p className="text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide">Filtros</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">Grupo</label>
                            <select
                                value={filterGroupId}
                                onChange={(e) => setFilterGroupId(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-[#E0E0E0] text-sm text-[#181818] bg-white focus:outline-none focus:ring-2 focus:ring-[#BBF451]"
                            >
                                <option value="">Todos los grupos</option>
                                {groups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {formatGrade(g.grade)} {g.section}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">Desde</label>
                                <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-[#E0E0E0] text-xs text-[#181818] focus:outline-none focus:ring-2 focus:ring-[#BBF451]" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">Hasta</label>
                                <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-[#E0E0E0] text-xs text-[#181818] focus:outline-none focus:ring-2 focus:ring-[#BBF451]" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">Tipo</label>
                        <div className="flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => setFilterType("")}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filterType === "" ? "bg-[#181818] text-white" : "bg-[#F5F5F5] text-[#8E8E8E] hover:bg-[#E0E0E0]"}`}>
                                Todos
                            </button>
                            {REPORT_TYPES.map((type) => (
                                <button key={type} type="button" onClick={() => setFilterType(filterType === type ? "" : type)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filterType === type ? "bg-[#181818] text-white" : `${REPORT_TYPE_COLORS[type]} hover:opacity-80`}`}>
                                    {REPORT_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {hasFilters && (
                        <button onClick={() => { setFilterGroupId(""); setFilterType(""); setFilterFrom(""); setFilterTo(""); }}
                            className="flex items-center gap-1.5 text-xs text-[#8E8E8E] hover:text-[#181818] transition-colors">
                            <X size={12} /> Limpiar filtros
                        </button>
                    )}
                </div>

                {/* Group cards */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-[#E0E0E0]" />
                        ))}
                    </div>
                ) : grouped.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-[#E0E0E0] text-center">
                        <ClipboardList size={32} className="mx-auto text-[#8E8E8E] mb-2" />
                        <p className="text-[#8E8E8E] text-sm">No hay reportes registrados</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {(() => {
                            // Sort by grade asc, then section asc
                            const sorted = [...grouped].sort((a, b) =>
                                a.group_grade !== b.group_grade
                                    ? a.group_grade - b.group_grade
                                    : a.group_section.localeCompare(b.group_section)
                            );
                            // Group by grade
                            const grades = [...new Set(sorted.map((g) => g.group_grade))];
                            return grades.map((grade) => {
                                const gradeGroups = sorted.filter((g) => g.group_grade === grade);
                                return (
                                    <div key={grade}>
                                        <p className="text-xs font-bold text-[#8E8E8E] uppercase tracking-wider px-1 mb-2">
                                            {formatGrade(grade)} · {gradeGroups.length} grupo{gradeGroups.length !== 1 ? "s" : ""}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {gradeGroups.map((g) => (
                                                <button
                                                    key={g.group_id}
                                                    onClick={() => router.push(`/reports/group/${g.group_id}`)}
                                                    className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-3.5 text-left active:scale-[0.99] transition-transform hover:border-[#BBBBBB] hover:shadow-sm"
                                                >
                                                    <div className="flex items-center justify-between mb-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base font-bold text-[#181818]">
                                                                {formatGrade(g.group_grade)} {g.group_section}
                                                            </span>
                                                            <span className="text-xs font-bold text-white bg-[#181818] px-2 py-0.5 rounded-full">
                                                                {g.total}
                                                            </span>
                                                        </div>
                                                        <ChevronRight size={15} className="text-[#C0C0C0] shrink-0" />
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {REPORT_TYPES.filter((t) => g.countByType[t]).map((t) => (
                                                            <span key={t} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${REPORT_TYPE_COLORS[t]}`}>
                                                                {g.countByType[t]} {REPORT_TYPE_LABELS[t]}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}
            </main>

            <CreateReportDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSaved={loadReports}
                preselectedGroupId={filterGroupId || undefined}
            />

            <BottomNav />
        </div>
    );
}
