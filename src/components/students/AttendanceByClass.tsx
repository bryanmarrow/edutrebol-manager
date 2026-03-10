interface ClassStat {
    classId: string;
    className: string;
    totalSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    percentPresent: number;
}

interface Props {
    data: ClassStat[];
}

export function AttendanceByClass({ data }: Props) {
    if (data.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-6 text-center">
                <p className="text-sm text-[#8E8E8E]">Sin materias registradas</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F0F0F0]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E]">
                    Desglose por materia
                </p>
            </div>
            <div className="divide-y divide-[#F5F5F5]">
                {data.map((cls) => {
                    const color = cls.percentPresent >= 85
                        ? 'text-emerald-600'
                        : cls.percentPresent >= 70
                        ? 'text-amber-600'
                        : 'text-rose-600';

                    const barColor = cls.percentPresent >= 85
                        ? 'bg-emerald-400'
                        : cls.percentPresent >= 70
                        ? 'bg-amber-400'
                        : 'bg-rose-400';

                    return (
                        <div key={cls.classId} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-1.5">
                                <p className="text-sm font-medium text-[#181818] truncate mr-2">{cls.className}</p>
                                <span className={`text-sm font-bold shrink-0 ${color}`}>{cls.percentPresent}%</span>
                            </div>
                            <div className="h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${barColor}`}
                                    style={{ width: `${cls.percentPresent}%` }}
                                />
                            </div>
                            <div className="flex gap-3 mt-1 text-[10px] text-[#8E8E8E]">
                                <span>{cls.totalSessions} sesiones</span>
                                <span>· {cls.totalAbsent} faltas</span>
                                {cls.totalLate > 0 && <span>· {cls.totalLate} tardanzas</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
