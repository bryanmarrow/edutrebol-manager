import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS, REPORT_TYPES } from "@/lib/conductReports";
import type { ConductReport } from "@/types";

interface Props {
    reports: ConductReport[];
}

function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

export function ConductSummary({ reports }: Props) {
    const countByType: Record<string, number> = {};
    for (const r of reports) {
        countByType[r.type] = (countByType[r.type] ?? 0) + 1;
    }

    return (
        <div className="space-y-3">
            {/* Header + pills */}
            <div className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E]">
                        Conducta
                    </p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        reports.length >= 5 ? 'bg-rose-100 text-rose-700'
                        : reports.length >= 3 ? 'bg-amber-100 text-amber-700'
                        : 'bg-[#F0F0F0] text-[#8E8E8E]'
                    }`}>
                        {reports.length} reporte{reports.length !== 1 ? 's' : ''}
                    </span>
                </div>
                {reports.length === 0 ? (
                    <p className="text-sm text-[#8E8E8E]">Sin reportes de conducta</p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {REPORT_TYPES.filter((t) => countByType[t]).map((t) => (
                            <span key={t} className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${REPORT_TYPE_COLORS[t]}`}>
                                {countByType[t]} {REPORT_TYPE_LABELS[t]}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Chronological list */}
            {reports.length > 0 && (
                <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
                    <div className="divide-y divide-[#F5F5F5]">
                        {reports.map((r) => (
                            <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                                <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${REPORT_TYPE_COLORS[r.type]}`}>
                                    {REPORT_TYPE_LABELS[r.type]}
                                </span>
                                <div className="flex-1 min-w-0">
                                    {r.notes && (
                                        <p className="text-xs text-[#181818] mb-0.5">{r.notes}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-[10px] text-[#8E8E8E]">
                                        <span>{formatDate(r.date)}</span>
                                        <span>· {r.teacher_name}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
