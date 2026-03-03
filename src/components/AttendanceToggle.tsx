"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AttendanceStatus } from "@/types";

interface AttendanceToggleProps {
    status: AttendanceStatus;
    onToggle: () => void;
    size?: "sm" | "md" | "lg";
}

const statusConfig = {
    present: {
        color: "bg-status-present text-[#181818] border-status-present",
        label: "P",
        ring: "ring-status-present/30",
    },
    absent: {
        color: "bg-status-absent text-white border-status-absent",
        label: "A",
        ring: "ring-status-absent/30",
    },
    late: {
        color: "bg-status-late text-white border-status-late",
        label: "R",
        ring: "ring-status-late/30",
    },
};

export function AttendanceToggle({ status, onToggle, size = "md" }: AttendanceToggleProps) {
    const config = statusConfig[status];

    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-11 h-11 text-base",
        lg: "w-14 h-14 text-lg",
    };

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
                // Haptic feedback if available
                if (navigator.vibrate) navigator.vibrate(10);
                onToggle();
            }}
            className={cn(
                "rounded-full flex items-center justify-center font-bold transition-colors shadow-sm border-2",
                config.color,
                sizeClasses[size],
                "focus:outline-none focus:ring-4",
                config.ring
            )}
            aria-label={`Mark as ${status}`}
        >
            {config.label}
        </motion.button>
    );
}
