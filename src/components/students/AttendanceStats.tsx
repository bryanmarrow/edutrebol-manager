interface Props {
    totalSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    percentPresent: number;
}

export function AttendanceStats({ totalSessions, totalPresent, totalAbsent, totalLate, percentPresent }: Props) {
    const color = percentPresent >= 85 ? 'text-emerald-600' : percentPresent >= 70 ? 'text-amber-600' : 'text-rose-600';
    const bg = percentPresent >= 85 ? 'bg-emerald-50 border-emerald-200' : percentPresent >= 70 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';

    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className={`rounded-xl border px-4 py-3 ${bg}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-0.5">Asistencia</p>
                <p className={`text-2xl font-bold ${color}`}>{percentPresent}%</p>
                <p className="text-[10px] text-[#8E8E8E]">{totalSessions} sesiones</p>
            </div>

            <div className="bg-white border border-[#E0E0E0] rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-0.5">Presentes</p>
                <p className="text-2xl font-bold text-[#181818]">{totalPresent}</p>
                <p className="text-[10px] text-[#8E8E8E]">de {totalSessions}</p>
            </div>

            <div className="bg-white border border-[#E0E0E0] rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-0.5">Faltas</p>
                <p className="text-2xl font-bold text-rose-600">{totalAbsent}</p>
                <p className="text-[10px] text-[#8E8E8E]">ausencias</p>
            </div>

            <div className="bg-white border border-[#E0E0E0] rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-0.5">Tardanzas</p>
                <p className="text-2xl font-bold text-amber-600">{totalLate}</p>
                <p className="text-[10px] text-[#8E8E8E]">retardos</p>
            </div>
        </div>
    );
}
