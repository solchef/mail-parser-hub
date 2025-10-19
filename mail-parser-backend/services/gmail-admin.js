import { google } from "googleapis";
import { getGmailAuth } from "../config/gmail.js";

export async function ensureGoogleWorkspaceUser(email, password) {

    const scopes = [
        "https://www.googleapis.com/auth/admin.directory.user",
        "https://www.googleapis.com/auth/admin.directory.user.readonly"
    ]
    const auth = getGmailAuth(process.env.GOOGLE_IMPERSONATE_EMAIL, scopes);

    const service = google.admin({ version: "directory_v1", auth });

    try {
        await service.users.get({ userKey: email });
        console.log(`[GWS] User ${email} already exists`);
        return true;
    } catch (err) {
        if (err.code === 404) {
            console.log(`[GWS] Creating Workspace user ${email}...`);
            await service.users.insert({
                requestBody: {
                    primaryEmail: email,
                    name: {
                        givenName: email.split("@")[0],
                        familyName: "User",
                    },
                    password,
                },
            });
            console.log(`[GWS] Created ${email}`);
            return true;
        } else {
            console.error("❌ GWS user lookup failed:", err.message);
            throw err;
        }
    }
}


export async function deleteGoogleWorkspaceUser(email) {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

    const auth = new google.auth.JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/admin.directory.user"],
        subject: process.env.GOOGLE_IMPERSONATE_EMAIL,
    });

    const service = google.admin({ version: "directory_v1", auth });

    try {
        await service.users.delete({ userKey: email });
        console.log(`[GWS] Deleted user ${email}`);
        return { deleted: true };
    } catch (err) {
        if (err.code === 404) return { deleted: false, message: "User not found" };
        throw err;
    }
}
