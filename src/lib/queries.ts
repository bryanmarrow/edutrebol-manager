import { supabase } from './supabase';
import type { ClassGroup, ConductReport, ConductReportType, Group, ScheduleSlot, StudentWithStatus, AttendanceStatus } from '@/types';

/** Converts legacy single-object schedule to the new array format. */
function normalizeSchedule(raw: unknown): ScheduleSlot[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as ScheduleSlot[];
    return [raw as ScheduleSlot]; // legacy: { days, start_time, end_time }
}

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
        .maybeSingle();

    if (!data) {
        // El usuario existe en auth pero no tiene registro en teachers — crearlo
        const { data: created } = await supabase
            .from('teachers')
            .insert({ id: user.id, email: user.email ?? '' })
            .select()
            .maybeSingle();
        return created;
    }

    return data;
}

// ============================================================
// GROUPS
// ============================================================

export async function getAllGroups(): Promise<Group[]> {
    const { data, error } = await supabase
        .from('groups')
        .select(`
            id,
            grade,
            section,
            school_year,
            students ( id ),
            classes ( id )
        `)
        .order('grade')
        .order('section');

    if (error) {
        console.error('Error fetching groups:', error);
        return [];
    }

    return (data || []).map((g: any) => ({
        id: g.id,
        grade: g.grade,
        section: g.section,
        school_year: g.school_year,
        student_count: g.students?.length ?? 0,
        class_count: g.classes?.length ?? 0,
    }));
}

export async function getGroupById(groupId: string): Promise<Group | null> {
    const { data, error } = await supabase
        .from('groups')
        .select(`
            id,
            grade,
            section,
            school_year,
            students ( id ),
            classes ( id )
        `)
        .eq('id', groupId)
        .single();

    if (error) {
        console.error('Error fetching group:', error);
        return null;
    }

    return {
        id: data.id,
        grade: data.grade,
        section: data.section,
        school_year: data.school_year,
        student_count: (data as any).students?.length ?? 0,
        class_count: (data as any).classes?.length ?? 0,
    };
}

export async function createGroup(data: {
    grade: number;
    section: string;
    school_year: string;
}): Promise<Group> {
    const { data: created, error } = await supabase
        .from('groups')
        .insert(data)
        .select()
        .single();

    if (error) {
        console.error('Error creating group:', error.message);
        throw error;
    }

    return { ...created, student_count: 0, class_count: 0 };
}

export async function deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

    if (error) {
        console.error('Error deleting group:', error.message);
        throw error;
    }
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
            group_id,
            groups ( grade, section, students ( id ) )
        `)
        .eq('teacher_id', user.id)
        .order('name');

    if (error) {
        console.error('Error fetching classes:', error);
        return [];
    }

    return (data || []).map((cls: any) => {
        const group = cls.groups;
        return {
            id: cls.id,
            name: cls.name,
            grade: group?.grade ?? cls.grade,
            section: group?.section ?? cls.section,
            group_id: cls.group_id,
            schedule: normalizeSchedule(cls.schedule),
            student_count: group?.students?.length ?? 0,
        };
    });
}

export async function updateClassSchedule(classId: string, schedule: ScheduleSlot[]) {
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
    group_id: string;
    grade: number;
    section: string;
    schedule: ScheduleSlot[];
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
    group_id: string;
    grade: number;
    section: string;
    schedule: ScheduleSlot[];
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
    const jsDay = new Date().getDay(); // 0=Sunday, 1=Monday … 6=Saturday

    const todayClasses = allClasses.filter((cls) =>
        cls.schedule?.some((slot) => slot.days.includes(jsDay)) ?? false
    );

    // Sort by the start_time of the slot that matches today
    todayClasses.sort((a, b) => {
        const slotA = a.schedule?.find((s) => s.days.includes(jsDay));
        const slotB = b.schedule?.find((s) => s.days.includes(jsDay));
        return (slotA?.start_time || '99:99').localeCompare(slotB?.start_time || '99:99');
    });

    return todayClasses;
}

// ============================================================
// STUDENTS
// ============================================================

export async function getStudentsByClass(classId: string): Promise<StudentWithStatus[]> {
    // Get class's group_id to find the correct students
    const { data: cls } = await supabase
        .from('classes')
        .select('group_id')
        .eq('id', classId)
        .single();

    let query = supabase
        .from('students')
        .select('id, group_id, first_name, last_name, student_id_official, avatar_url, active')
        .eq('active', true)
        .order('last_name')
        .order('first_name');

    if (cls?.group_id) {
        query = query.eq('group_id', cls.group_id);
    } else {
        // Fallback for legacy data without group_id
        query = query.eq('class_id', classId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching students:', error);
        return [];
    }

    return (data || []).map((s: any) => ({
        id: s.id,
        group_id: s.group_id,
        first_name: s.first_name,
        last_name: s.last_name,
        student_id_official: s.student_id_official,
        avatar_url: s.avatar_url,
        status: 'present' as AttendanceStatus,
    }));
}

export async function getAllStudentsByGroup(groupId: string) {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('group_id', groupId)
        .order('last_name')
        .order('first_name');

    if (error) {
        console.error('Error fetching students by group:', error.message);
        return [];
    }

    return data || [];
}

export async function getStudentById(studentId: string): Promise<{
    id: string;
    first_name: string;
    last_name: string;
    student_id_official?: string;
    group_id?: string;
    group_grade?: number;
    group_section?: string;
} | null> {
    const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_id_official, group_id, groups(grade, section)')
        .eq('id', studentId)
        .single();

    if (error) {
        console.error('Error fetching student:', error.message);
        return null;
    }

    return {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        student_id_official: data.student_id_official,
        group_id: data.group_id,
        group_grade: (data as any).groups?.grade,
        group_section: (data as any).groups?.section,
    };
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
        if (error.code === '23505') {
            // Duplicate key: concurrent call already created the session — fetch it
            const { data: found } = await supabase
                .from('attendance_sessions')
                .select('*')
                .eq('class_id', classId)
                .eq('date', date)
                .maybeSingle();
            return found;
        }
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
        .select('id, name, grade, section, schedule, group_id')
        .eq('id', classId)
        .single();

    return data;
}

// ============================================================
// STUDENT CRUD
// ============================================================

export async function createStudent(groupId: string, student: {
    first_name: string;
    last_name: string;
    student_id_official?: string;
}) {
    const { data, error } = await supabase
        .from('students')
        .insert({ ...student, group_id: groupId, active: true })
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

export async function updateTeacherName(fullName: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { error } = await supabase
        .from('teachers')
        .update({ full_name: fullName })
        .eq('id', user.id);

    if (error) {
        console.error('Error updating teacher name:', error.message);
        throw error;
    }
}

export async function getStudentIdsWithReports(groupId: string): Promise<Set<string>> {
    const { data, error } = await supabase
        .from('conduct_reports')
        .select('student_id')
        .eq('group_id', groupId);

    if (error) {
        console.error('Error fetching student report ids:', error.message);
        return new Set();
    }

    return new Set((data || []).map((r: any) => r.student_id as string));
}

export async function bulkDeleteStudents(studentIds: string[]): Promise<void> {
    if (studentIds.length === 0) return;

    const { error } = await supabase
        .from('students')
        .delete()
        .in('id', studentIds);

    if (error) {
        console.error('Error en eliminación en lote:', error.message);
        throw error;
    }
}

export async function bulkCreateStudents(
    groupId: string,
    students: { first_name: string; last_name: string }[]
) {
    const rows = students.map((s) => ({
        first_name: s.first_name,
        last_name: s.last_name,
        group_id: groupId,
        active: true,
    }));

    const { error } = await supabase.from('students').insert(rows);

    if (error) {
        console.error('Error en carga en lote:', error.message);
        throw error;
    }
}

// ============================================================
// CONDUCT REPORTS
// ============================================================

export async function createConductReport(data: {
    student_id: string;
    group_id: string;
    type: ConductReportType;
    notes?: string;
    date: string;
}): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { error } = await supabase
        .from('conduct_reports')
        .insert({ ...data, teacher_id: user.id });

    if (error) {
        console.error('Error creating conduct report:', error.message);
        throw error;
    }
}

export async function getConductReports(filters?: {
    group_id?: string;
    student_id?: string;
    type?: ConductReportType;
    from?: string;
    to?: string;
}): Promise<ConductReport[]> {
    let query = supabase
        .from('conduct_reports')
        .select(`
            id, student_id, group_id, teacher_id, type, notes, date, created_at,
            students ( first_name, last_name ),
            teachers ( full_name ),
            groups ( grade, section )
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

    if (filters?.group_id) query = query.eq('group_id', filters.group_id);
    if (filters?.student_id) query = query.eq('student_id', filters.student_id);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.from) query = query.gte('date', filters.from);
    if (filters?.to) query = query.lte('date', filters.to);

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching conduct reports:', error.message);
        return [];
    }

    return (data || []).map((r: any) => ({
        id: r.id,
        student_id: r.student_id,
        group_id: r.group_id,
        teacher_id: r.teacher_id,
        type: r.type as ConductReportType,
        notes: r.notes,
        date: r.date,
        created_at: r.created_at,
        student_first_name: r.students?.first_name,
        student_last_name: r.students?.last_name,
        teacher_name: r.teachers?.full_name ?? 'Maestro',
        group_grade: r.groups?.grade,
        group_section: r.groups?.section,
    }));
}

export interface GroupedReports {
    group_id: string;
    group_grade: number;
    group_section: string;
    total: number;
    countByType: Record<string, number>;
    reports: ConductReport[];
}

export function groupReportsByGroup(reports: ConductReport[]): GroupedReports[] {
    const map = new Map<string, GroupedReports>();

    for (const r of reports) {
        if (!r.group_id) continue;
        if (!map.has(r.group_id)) {
            map.set(r.group_id, {
                group_id: r.group_id,
                group_grade: r.group_grade ?? 0,
                group_section: r.group_section ?? '',
                total: 0,
                countByType: {},
                reports: [],
            });
        }
        const entry = map.get(r.group_id)!;
        entry.total += 1;
        entry.countByType[r.type] = (entry.countByType[r.type] ?? 0) + 1;
        entry.reports.push(r);
    }

    // Within each group: sort reports so students with more reports appear first
    for (const entry of map.values()) {
        const freq = new Map<string, number>();
        for (const r of entry.reports) freq.set(r.student_id, (freq.get(r.student_id) ?? 0) + 1);
        entry.reports.sort((a, b) => (freq.get(b.student_id) ?? 0) - (freq.get(a.student_id) ?? 0));
    }

    // Sort groups by total reports desc
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export async function getOrCreateShareToken(groupId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    // Try to get existing token
    const { data: existing } = await supabase
        .from('report_shares')
        .select('token')
        .eq('group_id', groupId)
        .maybeSingle();

    if (existing?.token) return existing.token;

    // Create new share
    const { data: created, error } = await supabase
        .from('report_shares')
        .insert({ group_id: groupId, created_by: user.id })
        .select('token')
        .single();

    if (error) {
        console.error('Error creating share token:', error.message);
        throw error;
    }

    return created.token;
}

// ============================================================
// STUDENT ATTENDANCE STATS
// ============================================================

function getWeekStart(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
}

export async function getStudentAttendanceStats(studentId: string): Promise<{
    totalSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    percentPresent: number;
}> {
    const { data, error } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('student_id', studentId);

    if (error || !data) return { totalSessions: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0, percentPresent: 0 };

    const totalSessions = data.length;
    const totalPresent = data.filter((r: any) => r.status === 'present').length;
    const totalAbsent = data.filter((r: any) => r.status === 'absent').length;
    const totalLate = data.filter((r: any) => r.status === 'late').length;
    const percentPresent = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

    return { totalSessions, totalPresent, totalAbsent, totalLate, percentPresent };
}

export async function getStudentAttendanceTrend(
    studentId: string,
    weeks = 8
): Promise<{ weekLabel: string; present: number; absent: number; late: number }[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('attendance_records')
        .select('status, attendance_sessions(date)')
        .eq('student_id', studentId);

    if (error || !data) return [];

    const filtered = data.filter((r: any) => {
        const date = r.attendance_sessions?.date;
        return date && date >= cutoffStr;
    });

    const map = new Map<string, { present: number; absent: number; late: number }>();
    for (const r of filtered) {
        const date = (r as any).attendance_sessions?.date;
        if (!date) continue;
        const week = getWeekStart(date);
        if (!map.has(week)) map.set(week, { present: 0, absent: 0, late: 0 });
        const entry = map.get(week)!;
        if (r.status === 'present') entry.present++;
        else if (r.status === 'absent') entry.absent++;
        else if (r.status === 'late') entry.late++;
    }

    const result: { weekLabel: string; present: number; absent: number; late: number }[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i * 7);
        const week = getWeekStart(d.toISOString().split('T')[0]);
        const label = new Date(week + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
        const entry = map.get(week) ?? { present: 0, absent: 0, late: 0 };
        result.push({ weekLabel: label, ...entry });
    }

    return result;
}

export async function getStudentAttendanceByClass(studentId: string): Promise<{
    classId: string;
    className: string;
    totalSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    percentPresent: number;
}[]> {
    const { data, error } = await supabase
        .from('attendance_records')
        .select('status, attendance_sessions(class_id, classes(id, name))')
        .eq('student_id', studentId);

    if (error || !data) return [];

    const map = new Map<string, {
        classId: string; className: string;
        present: number; absent: number; late: number; total: number;
    }>();

    for (const r of data) {
        const session = (r as any).attendance_sessions;
        const cls = session?.classes;
        if (!cls?.id) continue;
        if (!map.has(cls.id)) {
            map.set(cls.id, { classId: cls.id, className: cls.name ?? 'Sin nombre', present: 0, absent: 0, late: 0, total: 0 });
        }
        const entry = map.get(cls.id)!;
        entry.total++;
        if (r.status === 'present') entry.present++;
        else if (r.status === 'absent') entry.absent++;
        else if (r.status === 'late') entry.late++;
    }

    return Array.from(map.values()).map((e) => ({
        classId: e.classId,
        className: e.className,
        totalSessions: e.total,
        totalPresent: e.present,
        totalAbsent: e.absent,
        totalLate: e.late,
        percentPresent: e.total > 0 ? Math.round((e.present / e.total) * 100) : 0,
    })).sort((a, b) => a.className.localeCompare(b.className));
}

export async function getSharedGroupReports(token: string): Promise<ConductReport[]> {
    const { data, error } = await supabase
        .rpc('get_shared_group_reports', { p_token: token });

    if (error) {
        console.error('Error fetching shared reports:', error.message);
        return [];
    }

    return (data || []).map((r: any) => ({
        id: r.id,
        student_id: '',
        group_id: '',
        teacher_id: '',
        type: r.type as ConductReportType,
        notes: r.notes,
        date: r.date,
        created_at: r.created_at,
        student_first_name: r.student_first_name,
        student_last_name: r.student_last_name,
        teacher_name: r.teacher_name,
        group_grade: r.group_grade,
        group_section: r.group_section,
    }));
}
