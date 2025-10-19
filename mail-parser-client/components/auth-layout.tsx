// components/AuthLayout.tsx
"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

export default function AuthLayout({ children }: { children: ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("auth_token");

        if (!token) {
            router.push("/login");
        }
    }, [router]);

    return <>{children}</>;
}
