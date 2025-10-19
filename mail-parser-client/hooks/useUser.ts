// hooks/useUser.ts
"use client"

import { useEffect, useState } from "react"
import { getUserFromToken, DecodedUser } from "@/lib/auth"

export function useUser() {
    const [user, setUser] = useState<DecodedUser | null>(null)

    useEffect(() => {
        const decoded = getUserFromToken()
        setUser(decoded)
    }, [])

    return user
}
