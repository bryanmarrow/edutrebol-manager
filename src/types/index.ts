export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface Student {
    id: string;
    first_name: string;
    last_name: string;
    student_id_official?: string;
    avatar_url?: string;
}

export interface ClassGroup {
    id: string;
    name: string; // e.g. "Matemáticas I"
    grade: number; // e.g. 1, 2, 3
    section: string; // e.g. "B"
    schedule?: {
        days: number[]; // 1=Monday, 5=Friday
        start_time: string; // "08:00"
        end_time: string; // "09:00"
    };
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
