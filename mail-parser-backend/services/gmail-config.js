import { google } from "googleapis";
import { MailboxModel } from "../models/mailbox.model.js";

export async function testGmailConnectionService(inboxId) {
    const inbox = await MailboxModel.findById(inboxId);
    if (!inbox) throw new Error("Inbox not found");

    const config = JSON.parse(inbox.gmailConfig || "{}");
    const { clientId, clientSecret, refreshToken, redirectUri } = config;

    if (!clientId || !clientSecret || !refreshToken)
        throw new Error("Missing Gmail OAuth credentials");

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });

    if (!profile?.data?.emailAddress)
        throw new Error("Unable to fetch Gmail profile");

    return {
        email: profile.data.emailAddress,
        profile: profile.data,
    };
}

export async function updateGmailConfigService(inboxId, config) {
    const { clientId, clientSecret, refreshToken, redirectUri } = config;
    const inbox = await MailboxModel.findById(inboxId);
    if (!inbox) throw new Error("Inbox not found");

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });

    if (!profile?.data?.emailAddress)
        throw new Error("Failed to fetch Gmail profile");

    const connectedEmail = profile.data.emailAddress;

    await MailboxModel.patch({
        status: "active",
        gmailConfigured: true,
        gmailConfig: JSON.stringify({ clientId, clientSecret, refreshToken, redirectUri }),
        email: connectedEmail,
    }).where("id", inboxId);

    return {
        connectedEmail,
        gmailConfig: { clientId, clientSecret, refreshToken, redirectUri },
    };
}

export async function getGmailConfigService(inboxId) {
    const inbox = await MailboxModel.findById(inboxId);
    if (!inbox) throw new Error("Inbox not found");
    return JSON.parse(inbox.gmailConfig || "{}");
}
