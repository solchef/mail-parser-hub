import { google } from "googleapis";

export function getGmailAuth(userEmail, scopes) {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

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
