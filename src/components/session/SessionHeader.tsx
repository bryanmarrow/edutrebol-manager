"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionHeaderProps {
    access_className: string;
    groupName: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
}

export function SessionHeader({
    access_className,
    groupName,
    totalStudents,
    presentCount,
    absentCount,
    lateCount
}: SessionHeaderProps) {
    return (
        <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-20 pt-safe shadow-sm">
            <div className="flex items-center justify-between px-4 h-14">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="p-2 -ml-2 text-[#8E8E8E] hover:bg-[#F5F5F5] rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-[#181818] leading-none">{access_className}</h1>
                        <p className="text-xs text-[#8E8E8E] mt-1 font-medium">{groupName} • {totalStudents} Alumnos</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-2 text-[#8E8E8E] hover:bg-[#F5F5F5] rounded-full transition-colors" aria-label="Cambiar fecha">
                        <Calendar size={20} />
                    </button>
                    <button className="p-2 text-[#8E8E8E] hover:bg-[#F5F5F5] rounded-full relative transition-colors" aria-label="Filtrar">
                        <Filter size={20} />
                        {(absentCount > 0 || lateCount > 0) && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#BBF451] rounded-full border border-white" />
                        )}
                    </button>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="px-4 py-2 bg-[#F5F5F5] flex gap-4 text-xs font-medium border-t border-[#E0E0E0] overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 text-[#8E8E8E] whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8E8E8E]" />
                    Total: {totalStudents}
                </div>
                <div className="flex items-center gap-1.5 text-[#181818] whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BBF451]" />
                    Presentes: {presentCount}
                </div>
                <div className="flex items-center gap-1.5 text-rose-700 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Faltas: {absentCount}
                </div>
                <div className="flex items-center gap-1.5 text-[#1D4ED8] whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
                    Retardos: {lateCount}
                </div>
            </div>
        </header>
    );
}
