"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getClassInfo } from "@/lib/queries";

export default function StudentsRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;

    useEffect(() => {
        getClassInfo(classId).then((cls) => {
            if (cls?.group_id) {
                router.replace(`/groups/${cls.group_id}`);
            } else {
                router.replace("/groups");
            }
        });
    }, [classId, router]);

    return (
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-[#BBF451] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
