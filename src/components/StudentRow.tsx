"use client";

import { memo } from "react";
import { AttendanceToggle } from "./AttendanceToggle";
import { User } from "lucide-react";
import { StudentWithStatus } from "@/types";

interface StudentRowProps {
    student: StudentWithStatus;
    onToggle: (id: string) => void;
}

export const StudentRow = memo(function StudentRow({ student, onToggle }: StudentRowProps) {
    return (
        <div className="flex items-center justify-between py-3 px-4 border-b border-slate-100 bg-white active:bg-slate-50 transition-colors input-zoom-disable">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-medium">
                    <User className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-slate-900 leading-tight">
                        {student.last_name}, {student.first_name}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {student.student_id_official || "No ID"}
                    </p>
                </div>
            </div>

            <div className="pl-4">
                <AttendanceToggle
                    status={student.status}
                    onToggle={() => onToggle(student.id)}
                />
            </div>
        </div>
    );
}, (prev, next) => {
    return prev.student.status === next.student.status &&
        prev.student.id === next.student.id;
});
