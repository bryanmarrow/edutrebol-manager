"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, ChevronRight, Users, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassCardProps {
    id: string;
    name: string;
    group: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'completed' | 'upcoming';
    studentCount: number;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function ClassCard({ id, name, group, startTime, endTime, status, studentCount, onEdit, onDelete }: ClassCardProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    const statusStyles = {
        pending: "border-l-4 border-[#BBF451] bg-white",
        completed: "border-l-4 border-emerald-500 bg-[#F5F5F5] opacity-75",
        upcoming: "border-l-4 border-[#E0E0E0] bg-white opacity-90",
    };

    return (
        <div className={cn(
            "rounded-lg shadow-sm border border-[#E0E0E0] overflow-hidden",
            statusStyles[status]
        )}>
            {/* Main area — links to attendance */}
            <Link href={`/classes/${id}/session/today`} className="block p-4 transition-transform active:scale-[0.98]">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F5F5F5] text-[#181818] border border-[#E0E0E0]">
                                {group}
                            </span>
                            <span className="text-xs text-[#8E8E8E] flex items-center gap-1">
                                <Clock size={12} /> {startTime} - {endTime}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#181818]">{name}</h3>
                        <p className="text-sm text-[#8E8E8E]">{studentCount} Alumnos</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {status === 'completed' && (
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                Listado
                            </span>
                        )}
                        {status === 'pending' && (
                            <span className="w-8 h-8 rounded-full bg-[#BBF451] text-[#181818] flex items-center justify-center">
                                <ChevronRight size={20} />
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Bottom action bar */}
            <div className="border-t border-[#E0E0E0] px-4 py-2 flex items-center justify-between">
                <Link
                    href={`/classes/${id}/students`}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#8E8E8E] hover:text-[#181818] transition-colors px-2 py-1 rounded hover:bg-[#BBF451]"
                >
                    <Users size={14} />
                    Editar alumnos
                </Link>

                <div className="flex items-center gap-1">
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="p-2 rounded-lg text-[#8E8E8E] hover:text-[#181818] hover:bg-[#BBF451]/20 transition-colors"
                            title="Editar clase"
                        >
                            <Pencil size={14} />
                        </button>
                    )}

                    {onDelete && !confirmDelete && (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="p-2 rounded-lg text-[#8E8E8E] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar clase"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}

                    {confirmDelete && (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-rose-600 font-medium">¿Eliminar?</span>
                            <button
                                onClick={() => { onDelete?.(); setConfirmDelete(false); }}
                                className="text-xs px-2 py-1 bg-rose-600 text-white rounded font-medium"
                            >
                                Sí
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="text-xs px-2 py-1 bg-[#F5F5F5] text-[#181818] rounded font-medium"
                            >
                                No
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
