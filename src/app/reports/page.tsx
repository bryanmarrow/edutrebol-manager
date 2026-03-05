"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, ClipboardList, Share2, Copy, Check, X } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { CreateReportDrawer } from "@/components/CreateReportDrawer";
import { getConductReports, getAllGroups, getOrCreateShareToken } from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS, REPORT_TYPES } from "@/lib/conductReports";
import type { ConductReport, ConductReportType, Group } from "@/types";

export default function ReportsPage() {
    const [reports, setReports] = useState<ConductReport[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Filters
    const [filterGroupId, setFilterGroupId] = useState<string>("");
    const [filterType, setFilterType] = useState<ConductReportType | "">("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");

    // Share
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [generatingShare, setGeneratingShare] = useState(false);
    const [copied, setCopied] = useState(false);

    const loadReports = useCallback(async () => {
        setLoading(true);
        const data = await getConductReports({
            group_id: filterGroupId || undefined,
            type: filterType || undefined,
            from: filterFrom || undefined,
            to: filterTo || undefined,
        });
        setReports(data);
        setLoading(false);
    }, [filterGroupId, filterType, filterFrom, filterTo]);

    useEffect(() => {
        getAllGroups().then(setGroups);
    }, []);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    // Reset share token when group filter changes
    useEffect(() => {
        setShareToken(null);
        setCopied(false);
    }, [filterGroupId]);

    async function handleGenerateShare() {
        if (!filterGroupId) return;
        setGeneratingShare(true);
        try {
            const token = await getOrCreateShareToken(filterGroupId);
            setShareToken(token);
        } catch {
            toast.error("Error al generar link");
        }
        setGeneratingShare(false);
    }

    function handleCopyLink() {
        if (!shareToken) return;
        const url = `${window.location.origin}/reports/share/${shareToken}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            toast.success("Link copiado");
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    const selectedGroup = groups.find((g) => g.id === filterGroupId);

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-28">
            <TopBar title="Reportes de Conducta" />

            <main className="px-4 py-4 space-y-4">
                {/* Nuevo reporte button */}
                <button
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl bg-[#BBF451] text-[#181818] font-semibold text-sm active:scale-[0.98] transition-transform shadow-sm"
                >
                    <Plus size={16} />
                    Nuevo reporte
                </button>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-[#E0E0E0] p-4 space-y-3">
                    <p className="text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide">Filtros</p>

                    {/* Group */}
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

                    {/* Type */}
                    <div>
                        <label className="block text-[10px] font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">Tipo</label>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
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
                                    type="button"
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

                    {/* Clear filters */}
                    {(filterGroupId || filterType || filterFrom || filterTo) && (
                        <button
                            onClick={() => { setFilterGroupId(""); setFilterType(""); setFilterFrom(""); setFilterTo(""); }}
                            className="flex items-center gap-1.5 text-xs text-[#8E8E8E] hover:text-[#181818] transition-colors"
                        >
                            <X size={12} /> Limpiar filtros
                        </button>
                    )}
                </div>

                {/* Share section — only when a group is selected */}
                {filterGroupId && (
                    <div className="bg-white rounded-xl border border-[#E0E0E0] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm font-bold text-[#181818]">Compartir reporte</p>
                                <p className="text-xs text-[#8E8E8E]">
                                    Genera un link público para {selectedGroup ? `${formatGrade(selectedGroup.grade)} ${selectedGroup.section}` : "este grupo"}
                                </p>
                            </div>
                            <Share2 size={18} className="text-[#8E8E8E] shrink-0" />
                        </div>

                        {shareToken ? (
                            <div className="flex items-center gap-2">
                                <div className="flex-1 px-3 py-2 rounded-lg bg-[#F5F5F5] border border-[#E0E0E0] text-xs text-[#8E8E8E] font-mono truncate">
                                    {typeof window !== "undefined" ? `${window.location.origin}/reports/share/${shareToken}` : `/reports/share/${shareToken}`}
                                </div>
                                <button
                                    onClick={handleCopyLink}
                                    className="shrink-0 p-2 rounded-lg bg-[#BBF451] text-[#181818] hover:bg-[#AADE40] transition-colors"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleGenerateShare}
                                disabled={generatingShare}
                                className="w-full py-2 rounded-lg border border-[#E0E0E0] text-sm font-medium text-[#181818] hover:bg-[#F5F5F5] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                {generatingShare ? (
                                    <div className="h-4 w-4 border-2 border-[#181818]/30 border-t-[#181818] rounded-full animate-spin" />
                                ) : (
                                    <Share2 size={14} />
                                )}
                                Generar link compartible
                            </button>
                        )}
                    </div>
                )}

                {/* Reports list */}
                <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h2 className="text-xs font-bold text-[#8E8E8E] uppercase tracking-wider">
                            {loading ? "Cargando..." : `${reports.length} reporte${reports.length !== 1 ? "s" : ""}`}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-[#E0E0E0]" />
                            ))}
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl border border-[#E0E0E0] text-center">
                            <ClipboardList size={32} className="mx-auto text-[#8E8E8E] mb-2" />
                            <p className="text-[#8E8E8E] text-sm">No hay reportes registrados</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {reports.map((r) => (
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
                                                <p className="text-xs text-[#8E8E8E] mt-0.5 line-clamp-2">{r.notes}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#8E8E8E]">
                                                {r.group_grade != null && (
                                                    <span className="font-medium px-1.5 py-0.5 rounded bg-[#F5F5F5] text-[#181818]">
                                                        {formatGrade(r.group_grade)} {r.group_section}
                                                    </span>
                                                )}
                                                <span>{formatDate(r.date)}</span>
                                                <span>· {r.teacher_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
