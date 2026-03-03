"use client";

import { Loader2, Check, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionFooterProps {
    onSave: () => void;
    onFinish: () => void;
    isSaving?: boolean;
    hasChanges?: boolean;
}

export function SessionFooter({ onSave, onFinish, isSaving = false, hasChanges = false }: SessionFooterProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#E0E0E0] p-4 pb-safe z-30">
            <div className="max-w-md mx-auto">
                <button
                    onClick={hasChanges ? onSave : onFinish}
                    disabled={isSaving}
                    className={cn(
                        "w-full h-12 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-float active:scale-[0.98]",
                        hasChanges
                            ? "bg-[#181818] text-white hover:bg-[#2a2a2a] shadow-black/20"
                            : "bg-[#BBF451] text-[#181818] hover:bg-[#AADE40] shadow-[#BBF451]/30"
                    )}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="animate-spin" size={20} /> Guardando...
                        </>
                    ) : (
                        <>
                            {hasChanges ? (
                                <><Save size={20} /> Guardar Cambios</>
                            ) : (
                                <><Check className="stroke-[3px]" size={20} /> Terminar Clase</>
                            )}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
