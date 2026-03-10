"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Share2, Copy, Check, ClipboardList, X, ChevronDown, ChevronUp } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { getConductReports, getAllGroups, getOrCreateShareToken } from "@/lib/queries";
import { formatGrade } from "@/lib/utils";
import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS, REPORT_TYPES } from "@/lib/conductReports";
import type { ConductReport, ConductReportType, Group } from "@/types";

interface StudentGroup {
    student_id: string;
    student_name: string;
    reports: ConductReport[];
    countByType: Record<string, number>;
}

export default function GroupReportsPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const router = useRouter();

    const [reports, setReports] = useState<ConductReport[]>([]);
    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);

    const [filterType, setFilterType] = useState<ConductReportType | "">("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");

    const [shareToken, setShareToken] = useState<string | null>(null);
    const [generatingShare, setGeneratingShare] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    const loadReports = useCallback(async () => {
        setLoading(true);
        const data = await getConductReports({
            group_id: groupId,
            type: filterType || undefined,
            from: filterFrom || undefined,
            to: filterTo || undefined,
        });
        setReports(data);
        setLoading(false);
    }, [groupId, filterType, filterFrom, filterTo]);

    useEffect(() => {
        getAllGroups().then((gs) => setGroup(gs.find((g) => g.id === groupId) ?? null));
    }, [groupId]);

    useEffect(() => { loadReports(); }, [loadReports]);

    async function handleGenerateShare() {
        setGeneratingShare(true);
        try {
            const token = await getOrCreateShareToken(groupId);
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
            day: "numeric", month: "short", year: "numeric",
        });
    }

    // Build per-student structure
    const byStudent: StudentGroup[] = (() => {
        const map = new Map<string, StudentGroup>();
        for (const r of reports) {
            if (!map.has(r.student_id)) {
                map.set(r.student_id, {
                    student_id: r.student_id,
                    student_name: `${r.student_last_name ?? ""} ${r.student_first_name ?? ""}`.trim(),
                    reports: [],
                    countByType: {},
                });
            }
            const entry = map.get(r.student_id)!;
            entry.reports.push(r);
            entry.countByType[r.type] = (entry.countByType[r.type] ?? 0) + 1;
        }
        return Array.from(map.values()).sort((a, b) => b.reports.length - a.reports.length);
    })();

    // Group-level metrics
    const countByType: Record<string, number> = {};
    for (const r of reports) countByType[r.type] = (countByType[r.type] ?? 0) + 1;
    const topType = REPORT_TYPES.filter((t) => countByType[t]).sort((a, b) => (countByType[b] ?? 0) - (countByType[a] ?? 0))[0];
    const topStudent = byStudent[0] ?? null;

    const groupLabel = group ? `${formatGrade(group.grade)} ${group.section}` : "Grupo";
    const hasFilters = !!(filterType || filterFrom || filterTo);

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-28">
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#E0E0E0] px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => router.push("/reports")}
                    className="p-1.5 -ml-1 rounded-lg text-[#181818] hover:bg-[#F5F5F5] transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-base font-bold text-[#181818] truncate">{groupLabel}</h1>
                    <p className="text-xs text-[#8E8E8E]">Reportes de conducta</p>
                </div>
                <button
                    onClick={() => setShareOpen((v) => !v)}
                    className="p-1.5 rounded-lg text-[#8E8E8E] hover:bg-[#F5F5F5] transition-colors"
                >
                    <Share2 size={18} />
                </button>
            </div>

            <main className="px-4 py-4 space-y-4 max-w-5xl mx-auto">
                {/* Share panel */}
                {shareOpen && (
                    <div className="bg-white rounded-xl border border-[#E0E0E0] p-4">
                        <p className="text-sm font-bold text-[#181818] mb-1">Compartir reporte de {groupLabel}</p>
                        <p className="text-xs text-[#8E8E8E] mb-3">Genera un link público de solo lectura</p>
                        {shareToken ? (
                            <div className="flex items-center gap-2">
                                <div className="flex-1 px-3 py-2 rounded-lg bg-[#F5F5F5] border border-[#E0E0E0] text-xs text-[#8E8E8E] font-mono truncate">
                                    {typeof window !== "undefined"
                                        ? `${window.location.origin}/reports/share/${shareToken}`
                                        : `/reports/share/${shareToken}`}
                                </div>
                                <button onClick={handleCopyLink}
                                    className="shrink-0 p-2 rounded-lg bg-[#BBF451] text-[#181818] hover:bg-[#AADE40] transition-colors">
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        ) : (
                            <button onClick={handleGenerateShare} disabled={generatingShare}
                                className="w-full py-2 rounded-lg border border-[#E0E0E0] text-sm font-medium text-[#181818] hover:bg-[#F5F5F5] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                                {generatingShare
                                    ? <div className="h-4 w-4 border-2 border-[#181818]/30 border-t-[#181818] rounded-full animate-spin" />
                                    : <Share2 size={14} />}
                                Generar link compartible
                            </button>
                        )}
                    </div>
                )}

                {/* Metrics */}
                {!loading && reports.length > 0 && (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {/* Total */}
                            <div className="bg-[#181818] text-white rounded-xl px-4 py-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60 mb-0.5">Total</p>
                                <p className="text-2xl font-bold">{reports.length}</p>
                                <p className="text-[10px] text-white/60">{byStudent.length} alumno{byStudent.length !== 1 ? "s" : ""}</p>
                            </div>

                            {/* Top student */}
                            {topStudent && (
                                <div className="bg-white border border-[#E0E0E0] rounded-xl px-4 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-0.5">Más reportes</p>
                                    <p className="text-sm font-bold text-[#181818] leading-tight truncate">{topStudent.student_name}</p>
                                    <p className="text-[10px] text-[#8E8E8E]">{topStudent.reports.length} reporte{topStudent.reports.length !== 1 ? "s" : ""}</p>
                                </div>
                            )}

                            {/* Top 2 types */}
                            {REPORT_TYPES.filter((t) => countByType[t]).slice(0, 2).map((t) => (
                                <div key={t} className={`rounded-xl px-4 py-3 border ${REPORT_TYPE_COLORS[t]}`}>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-0.5 truncate">
                                        {REPORT_TYPE_LABELS[t]}
                                    </p>
                                    <p className="text-2xl font-bold text-[#181818]">{countByType[t]}</p>
                                    <p className="text-[10px] text-[#8E8E8E]">
                                        {Math.round((countByType[t] / reports.length) * 100)}% del total
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Breakdown bar */}
                        <div className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-2">Desglose por tipo</p>
                            <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-2">
                                {REPORT_TYPES.filter((t) => countByType[t]).map((t) => (
                                    <div key={t} style={{ flex: countByType[t] }} className={REPORT_TYPE_COLORS[t].split(" ")[0]} />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {REPORT_TYPES.filter((t) => countByType[t]).map((t) => (
                                    <div key={t} className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${REPORT_TYPE_COLORS[t].split(" ")[0]}`} />
                                        <span className="text-[10px] text-[#8E8E8E]">
                                            {REPORT_TYPE_LABELS[t]} <span className="font-semibold text-[#181818]">{countByType[t]}</span>
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
                    <div className="grid grid-cols-2 gap-3">
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
                    {hasFilters && (
                        <button onClick={() => { setFilterType(""); setFilterFrom(""); setFilterTo(""); }}
                            className="flex items-center gap-1.5 text-xs text-[#8E8E8E] hover:text-[#181818] transition-colors">
                            <X size={12} /> Limpiar filtros
                        </button>
                    )}
                </div>

                {/* Student cards */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-[#E0E0E0]" />
                        ))}
                    </div>
                ) : byStudent.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-[#E0E0E0] text-center">
                        <ClipboardList size={32} className="mx-auto text-[#8E8E8E] mb-2" />
                        <p className="text-[#8E8E8E] text-sm">No hay reportes para este grupo</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
                        {byStudent.map((sg) => {
                            const isExpanded = expanded === sg.student_id;
                            const isTop = sg.student_id === topStudent?.student_id;
                            return (
                                <div key={sg.student_id}
                                    className={`bg-white rounded-xl border overflow-hidden transition-shadow ${isTop ? "border-[#181818]" : "border-[#E0E0E0]"}`}>
                                    {/* Card header — always visible */}
                                    <button
                                        onClick={() => setExpanded(isExpanded ? null : sg.student_id)}
                                        className="w-full px-4 py-3.5 text-left hover:bg-[#FAFAFA] transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Link
                                                    href={`/students/${sg.student_id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-sm font-bold text-[#181818] truncate hover:underline"
                                                >
                                                    {sg.student_name}
                                                </Link>
                                                {isTop && (
                                                    <span className="shrink-0 text-[9px] font-bold bg-[#181818] text-white px-1.5 py-0.5 rounded-full">
                                                        TOP
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                    sg.reports.length >= 5 ? "bg-rose-100 text-rose-700"
                                                    : sg.reports.length >= 3 ? "bg-amber-100 text-amber-700"
                                                    : "bg-[#F0F0F0] text-[#8E8E8E]"
                                                }`}>
                                                    {sg.reports.length}
                                                </span>
                                                {isExpanded ? <ChevronUp size={14} className="text-[#8E8E8E]" /> : <ChevronDown size={14} className="text-[#8E8E8E]" />}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {REPORT_TYPES.filter((t) => sg.countByType[t]).map((t) => (
                                                <span key={t} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${REPORT_TYPE_COLORS[t]}`}>
                                                    {sg.countByType[t]} {REPORT_TYPE_LABELS[t]}
                                                </span>
                                            ))}
                                        </div>
                                    </button>

                                    {/* Expandable reports */}
                                    {isExpanded && (
                                        <div className="border-t border-[#F0F0F0] divide-y divide-[#F5F5F5]">
                                            {sg.reports.map((r) => (
                                                <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                                                    <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${REPORT_TYPE_COLORS[r.type]}`}>
                                                        {REPORT_TYPE_LABELS[r.type]}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        {r.notes && (
                                                            <p className="text-xs text-[#8E8E8E] line-clamp-2">{r.notes}</p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#8E8E8E]">
                                                            <span>{formatDate(r.date)}</span>
                                                            <span>· {r.teacher_name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
