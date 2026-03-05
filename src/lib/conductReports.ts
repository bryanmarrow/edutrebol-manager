import type { ConductReportType } from '@/types';

export const REPORT_TYPE_LABELS: Record<ConductReportType, string> = {
    uniform:    'No llevó uniforme',
    late:       'Llegó tarde',
    left_class: 'Se salió de clase',
    homework:   'No cumplió tareas',
    other:      'Otro',
};

export const REPORT_TYPE_COLORS: Record<ConductReportType, string> = {
    uniform:    'bg-amber-100 text-amber-700',
    late:       'bg-blue-100 text-blue-700',
    left_class: 'bg-rose-100 text-rose-700',
    homework:   'bg-purple-100 text-purple-700',
    other:      'bg-[#F5F5F5] text-[#8E8E8E]',
};

export const REPORT_TYPES: ConductReportType[] = [
    'uniform', 'late', 'left_class', 'homework', 'other',
];
