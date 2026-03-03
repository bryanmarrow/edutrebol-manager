"use client";

import { useState, useEffect } from "react";

import { Bell, Cloud, CloudOff, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface TopBarProps {
    userName?: string;
    isOnline?: boolean;
    className?: string;
    title?: string;
    showBack?: boolean;
}

export function TopBar({ userName = "Profesor", isOnline = true, className, title, showBack }: TopBarProps) {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState("");

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
        }));
    }, []);

    return (
        <header className={cn("flex items-center justify-between px-4 py-4 bg-[#181818] sticky top-0 z-40 pt-safe border-b border-[#181818] transition-all", className)}>
            <div className="flex items-center gap-3">
                {showBack && (
                    <button onClick={() => router.back()} className="p-1 -ml-1 rounded-md hover:bg-white/10 text-[#8E8E8E] hover:text-white">
                        <ArrowLeft size={22} />
                    </button>
                )}
                <div>
                    {title ? (
                        <h1 className="text-xl font-bold text-white leading-tight">{title}</h1>
                    ) : (
                        <>
                            <h1 className="text-xl font-bold text-white leading-tight">Hola, {userName}</h1>
                            <p className="text-sm text-[#8E8E8E] capitalize">{currentDate}</p>
                        </>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button className="p-2 text-[#8E8E8E] hover:text-white rounded-full hover:bg-white/10 transition-colors">
                    {isOnline ? <Cloud size={20} /> : <CloudOff size={20} className="text-[#8E8E8E]" />}
                </button>
                <div className="w-8 h-8 bg-[#BBF451] rounded-full flex items-center justify-center text-[#181818] font-semibold text-sm">
                    {userName.charAt(0)}
                </div>
            </div>
        </header>
    );
}
