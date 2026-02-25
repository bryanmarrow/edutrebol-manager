import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const GRADE_LABELS: Record<number, string> = { 1: "1ero", 2: "2do", 3: "3ero" };

export function formatGrade(grade: number): string {
    return GRADE_LABELS[grade] ?? `${grade}°`;
}
