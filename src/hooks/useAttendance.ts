"use client";

import { useState, useEffect, useCallback } from "react";
import { StudentWithStatus, AttendanceStatus } from "@/types";

const STORAGE_KEY_PREFIX = "attendance_session_";

export function useAttendance(sessionId: string, initialStudents: StudentWithStatus[] = []) {
    const [students, setStudents] = useState<StudentWithStatus[]>(initialStudents);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
        if (saved) {
            try {
                setStudents(JSON.parse(saved));
                setHasUnsavedChanges(true); // Assume if checking storage, might be unsaved
            } catch (e) {
                console.error("Failed to parse saved attendance", e);
                setStudents(initialStudents);
            }
        } else if (initialStudents.length > 0) {
            setStudents(initialStudents);
        }
        setIsLoaded(true);
    }, [sessionId, initialStudents.length]); // Dependency check: strictly we only want to run this once or when initialStudents populates

    // Save to storage on change
    useEffect(() => {
        if (isLoaded && students.length > 0) {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${sessionId}`, JSON.stringify(students));
        }
    }, [students, sessionId, isLoaded]);

    const toggleStatus = useCallback((studentId: string) => {
        setHasUnsavedChanges(true);
        setStudents((prev) =>
            prev.map((student) => {
                if (student.id !== studentId) return student;

                const nextStatus: Record<AttendanceStatus, AttendanceStatus> = {
                    present: 'absent',
                    absent: 'late',
                    late: 'present'
                };

                return { ...student, status: nextStatus[student.status] };
            })
        );
    }, []);

    const clearLocalSave = useCallback(() => {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
        setHasUnsavedChanges(false);
    }, [sessionId]);

    const stats = students.reduce(
        (acc, student) => {
            acc.total++;
            if (student.status === 'present') acc.present++;
            if (student.status === 'absent') acc.absent++;
            if (student.status === 'late') acc.late++;
            return acc;
        },
        { total: 0, present: 0, absent: 0, late: 0 }
    );

    return {
        students,
        stats,
        hasUnsavedChanges,
        toggleStatus,
        clearLocalSave,
        isLoaded
    };
}
