"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogIn, Loader2, BookOpen } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#BBF451] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <BookOpen className="text-[#181818]" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-[#181818]">Asistencia</h1>
                    <p className="text-[#8E8E8E] text-sm mt-1">Control de asistencia escolar</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[#181818] mb-1">
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="profesor@escuela.edu.mx"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-[#E0E0E0] bg-white text-[#181818] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-2 focus:ring-[#BBF451] focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[#181818] mb-1">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-[#E0E0E0] bg-white text-[#181818] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-2 focus:ring-[#BBF451] focus:border-transparent transition-all"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#BBF451] text-[#181818] font-semibold py-3 rounded-lg hover:bg-[#AADE40] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <LogIn size={20} />
                        )}
                        {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </button>
                </form>
            </div>
        </div>
    );
}
