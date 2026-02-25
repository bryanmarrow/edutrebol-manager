import { supabase } from './supabase';
import type { ClassGroup, StudentWithStatus, AttendanceStatus } from '@/types';

// ============================================================
// TEACHER
// ============================================================

export async function getCurrentTeacher() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', user.id)
        .single();

    return data;
}

// ============================================================
// CLASSES
// ============================================================

export async function getTeacherClasses(): Promise<ClassGroup[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('classes')
        .select(`
      id,
      name,
      grade,
      section,
      schedule,
      students ( id )
    `)
        .eq('teacher_id', user.id)
        .order('name');

    if (error) {
        console.error('Error fetching classes:', error);
        return [];
    }

    return (data || []).map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        section: cls.section,
        schedule: cls.schedule,
        student_count: cls.students?.length || 0,
    }));
}

export async function updateClassSchedule(classId: string, schedule: {
    days: number[];
    start_time: string;
    end_time: string;
}) {
    const { error } = await supabase
        .from('classes')
        .update({ schedule })
        .eq('id', classId);

    if (error) {
        console.error('Error updating schedule:', error.message);
        throw error;
    }

    return true;
}

export async function createClass(data: {
    name: string;
    grade: string;
    section: string;
    schedule: { days: number[]; start_time: string; end_time: string };
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data: created, error } = await supabase
        .from('classes')
        .insert({ ...data, teacher_id: user.id })
        .select()
        .single();

    if (error) {
        console.error('Error creating class:', error.message);
        throw error;
    }

    return created;
}

export async function updateClass(classId: string, data: {
    name: string;
    grade: string;
    section: string;
    schedule: { days: number[]; start_time: string; end_time: string };
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { error } = await supabase
        .from('classes')
        .update(data)
        .eq('id', classId)
        .eq('teacher_id', user.id);

    if (error) {
        console.error('Error updating class:', error.message);
        throw error;
    }

    return true;
}

export async function deleteClass(classId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)
        .eq('teacher_id', user.id);

    if (error) {
        console.error('Error deleting class:', error.message);
        throw error;
    }

    return true;
}

export async function getTodayClasses(): Promise<ClassGroup[]> {
    const allClasses = await getTeacherClasses();
    // JS getDay(): 0=Sunday, 1=Monday ... 6=Saturday
    // Schema convention: 1=Monday ... 5=Friday, 6=Saturday, 0=Sunday
    const jsDay = new Date().getDay(); // 0-6
    const schemaDay = jsDay === 0 ? 0 : jsDay; // Already 1-6 for Mon-Sat, 0 for Sun

    const todayClasses = allClasses.filter((cls) => {
        if (!cls.schedule?.days) return false;
        return cls.schedule.days.includes(schemaDay);
    });

    // Sort by start_time
    todayClasses.sort((a, b) => {
        const timeA = a.schedule?.start_time || '99:99';
        const timeB = b.schedule?.start_time || '99:99';
        return timeA.localeCompare(timeB);
    });

    return todayClasses;
}

// ============================================================
// STUDENTS
// ============================================================

export async function getStudentsByClass(classId: string): Promise<StudentWithStatus[]> {
    const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_id_official, avatar_url, active')
        .eq('class_id', classId)
        .eq('active', true)
        .order('last_name');

    if (error) {
        console.error('Error fetching students:', error);
        return [];
    }

    return (data || []).map((s: any) => ({
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        student_id_official: s.student_id_official,
        avatar_url: s.avatar_url,
        status: 'present' as AttendanceStatus,
    }));
}

// ============================================================
// ATTENDANCE SESSIONS
// ============================================================

export async function getOrCreateSession(classId: string, date: string) {
    // Try to find existing session (.maybeSingle returns null instead of error when no rows)
    const { data: existing } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('class_id', classId)
        .eq('date', date)
        .maybeSingle();

    if (existing) return existing;

    // Create new session
    const { data: created, error } = await supabase
        .from('attendance_sessions')
        .insert({ class_id: classId, date })
        .select()
        .single();

    if (error) {
        console.error('Error creating session:', error.message, error.code, error.details);
        return null;
    }

    return created;
}

// ============================================================
// ATTENDANCE RECORDS
// ============================================================

export async function getAttendanceRecords(sessionId: string) {
    const { data, error } = await supabase
        .from('attendance_records')
        .select('student_id, status')
        .eq('session_id', sessionId);

    if (error) {
        console.error('Error fetching records:', error);
        return [];
    }

    return data || [];
}

export async function saveAttendanceRecords(
    sessionId: string,
    records: { student_id: string; status: AttendanceStatus }[]
) {
    const upsertData = records.map((r) => ({
        session_id: sessionId,
        student_id: r.student_id,
        status: r.status,
        updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
        .from('attendance_records')
        .upsert(upsertData, { onConflict: 'session_id,student_id' });

    if (error) {
        console.error('Error saving records:', error);
        throw error;
    }

    // Mark session as finalized
    await supabase
        .from('attendance_sessions')
        .update({ finalized: true })
        .eq('id', sessionId);

    return true;
}

export async function getClassInfo(classId: string) {
    const { data } = await supabase
        .from('classes')
        .select('id, name, grade, section, schedule')
        .eq('id', classId)
        .single();

    return data;
}

// ============================================================
// STUDENT CRUD
// ============================================================

export async function getAllStudentsByClass(classId: string) {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('last_name');

    if (error) {
        console.error('Error fetching all students:', error.message);
        return [];
    }

    return data || [];
}

export async function createStudent(classId: string, student: {
    first_name: string;
    last_name: string;
    student_id_official?: string;
}) {
    const { data, error } = await supabase
        .from('students')
        .insert({ ...student, class_id: classId, active: true })
        .select()
        .single();

    if (error) {
        console.error('Error creating student:', error.message);
        throw error;
    }

    return data;
}

export async function updateStudent(studentId: string, updates: {
    first_name?: string;
    last_name?: string;
    student_id_official?: string;
    active?: boolean;
}) {
    const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', studentId)
        .select()
        .single();

    if (error) {
        console.error('Error updating student:', error.message);
        throw error;
    }

    return data;
}

export async function deleteStudent(studentId: string) {
    const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

    if (error) {
        console.error('Error deleting student:', error.message);
        throw error;
    }

    return true;
}
