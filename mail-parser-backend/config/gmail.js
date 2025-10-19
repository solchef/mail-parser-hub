import { google } from "googleapis";

export function getGmailAuth(userEmail, scopes) {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

    // Ensure clean array of scopes
    // const effectiveScopes = (scopes ? scopes.join(",") : process.env.GOOGLE_SCOPES || "")
    //     .split(",")
    //     .map((s) => s.trim())
    //     .filter(Boolean);
    // console.log(scopes)

    return new google.auth.JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: privateKey,
        scopes: scopes,
        subject: userEmail,
    });
}

export function getGmailClient(auth) {
    return google.gmail({ version: "v1", auth });
}
