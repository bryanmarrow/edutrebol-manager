"use client";

import { ClipboardList, Users, CalendarDays, BarChart3, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { label: "Hoy", icon: ClipboardList, href: "/dashboard" },
        { label: "Grupos", icon: Users, href: "/classes" },
        { label: "Horario", icon: CalendarDays, href: "/schedule" },
        { label: "Reportes", icon: BarChart3, href: "/reports" },
        { label: "Perfil", icon: Settings, href: "/profile" },
    ];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-[#2a2a2a] z-[999] shadow-[0_-1px_3px_rgba(0,0,0,0.2)]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                                isActive ? "text-[#BBF451]" : "text-[#8E8E8E] hover:text-white"
                            )}
                        >
                            <item.icon size={22} className={cn("transition-transform", isActive && "scale-110")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
