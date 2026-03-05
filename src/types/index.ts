export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface Group {
    id: string;
    grade: number;      // 1, 2, 3
    section: string;    // e.g. "A", "B"
    school_year: string; // e.g. "2025-2026"
    student_count?: number;
    class_count?: number;
}

export interface Student {
    id: string;
    group_id?: string;
    first_name: string;
    last_name: string;
    student_id_official?: string;
    avatar_url?: string;
}

export interface ScheduleSlot {
    days: number[]; // 1=Monday … 6=Saturday, 0=Sunday
    start_time: string; // "HH:MM"
    end_time: string;   // "HH:MM"
}

export interface ClassGroup {
    id: string;
    name: string; // e.g. "Matemáticas I"
    grade: number; // e.g. 1, 2, 3
    section: string; // e.g. "B"
    group_id?: string;
    schedule?: ScheduleSlot[]; // one slot per distinct time block
    student_count?: number;
}

export interface AttendanceSession {
    id: string;
    class_id: string;
    date: string; // ISO YYYY-MM-DD
    finalized: boolean;
    created_at: string;
}

export interface AttendanceRecord {
    id: string;
    session_id: string;
    student_id: string;
    status: AttendanceStatus;
    notes?: string;
    updated_at: string;
}

// UI Helper Types
export interface StudentWithStatus extends Student {
    status: AttendanceStatus;
}

// Conduct Reports
export type ConductReportType = 'uniform' | 'late' | 'left_class' | 'homework' | 'other';

export interface ConductReport {
    id: string;
    student_id: string;
    group_id: string;
    teacher_id: string;
    type: ConductReportType;
    notes?: string;
    date: string;           // YYYY-MM-DD
    created_at: string;
    // Joined fields
    student_first_name?: string;
    student_last_name?: string;
    teacher_name?: string;
    group_grade?: number;
    group_section?: string;
}
