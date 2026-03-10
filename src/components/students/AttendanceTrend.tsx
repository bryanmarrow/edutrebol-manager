"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface WeekData {
    weekLabel: string;
    present: number;
    absent: number;
    late: number;
}

interface Props {
    data: WeekData[];
}

export function AttendanceTrend({ data }: Props) {
    const hasData = data.some((w) => w.present + w.absent + w.late > 0);

    if (!hasData) {
        return (
            <div className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-8 text-center">
                <p className="text-sm text-[#8E8E8E]">Sin datos de asistencia registrados</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E8E] mb-3">
                Tendencia — últimas 8 semanas
            </p>
            <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data} barSize={8} barCategoryGap="30%">
                    <XAxis
                        dataKey="weekLabel"
                        tick={{ fontSize: 9, fill: '#8E8E8E' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E0E0E0' }}
                        labelStyle={{ fontWeight: 600, color: '#181818' }}
                    />
                    <Legend
                        iconType="circle"
                        iconSize={7}
                        wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                        formatter={(value) =>
                            value === 'present' ? 'Presente' : value === 'absent' ? 'Falta' : 'Tardanza'
                        }
                    />
                    <Bar dataKey="present" name="present" stackId="a" fill="#BBF451" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="late" name="late" stackId="a" fill="#FCD34D" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="absent" name="absent" stackId="a" fill="#FB7185" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
