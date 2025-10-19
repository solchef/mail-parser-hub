// lib/auth.ts
import { jwtDecode } from "jwt-decode"

export interface DecodedUser {
    id: string
    email: string
    name?: string
    role?: string
    exp?: number
    [key: string]: any
}

export function getUserFromToken(): DecodedUser | null {
    if (typeof window === "undefined") return null

    const token = localStorage.getItem("auth_token")
    if (!token) return null

    try {
        const decoded = jwtDecode<DecodedUser>(token)
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            console.warn("JWT expired, clearing...")
            localStorage.removeItem("auth_token")
            return null
        }
        return decoded
    } catch (err) {
        console.error("Invalid JWT token:", err)
        localStorage.removeItem("auth_token")
        return null
    }
}
