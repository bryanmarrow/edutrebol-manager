"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-12 w-12 bg-indigo-200 rounded-full" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return null;
}
