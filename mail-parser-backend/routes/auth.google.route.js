import express from "express"
import { google } from "googleapis"
import { db } from "../config/lowdb.js"

const router = express.Router()

const {
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI,
} = process.env

// Step 1: Start OAuth for a specific inbox
router.get("/", async (req, res) => {
    const inboxId = req.query.inboxId
    if (!inboxId) return res.status(400).send("Missing inboxId")

    const oauth2Client = new google.auth.OAuth2(
        GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET,
        GMAIL_REDIRECT_URI
    )

    const scopes = ["https://mail.google.com/"]

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: scopes,
        state: inboxId,
    })

    res.redirect(authUrl)
})

// Step 2: Callback
router.get("/callback", async (req, res) => {
    const code = req.query.code;
    const inboxId = req.query.state;

    if (!code || !inboxId) return res.status(400).send("Missing parameters");

    try {
        const oauth2Client = new google.auth.OAuth2(
            GMAIL_CLIENT_ID,
            GMAIL_CLIENT_SECRET,
            GMAIL_REDIRECT_URI
        );

        // Exchange the authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get the Gmail account that was actually authorized
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: "me" });
        const connectedEmail = profile?.data?.emailAddress;

        if (!connectedEmail) {
            throw new Error("Unable to retrieve connected Gmail address");
        }

        // Update your database
        await db.read();
        const inbox = db.data.mailboxes.find((i) => i.id === inboxId);
        if (!inbox) return res.status(404).send("Inbox not found");

        inbox.gmailConfig = {
            ...inbox.gmailConfig,
            clientId: GMAIL_CLIENT_ID,
            clientSecret: GMAIL_CLIENT_SECRET,
            refreshToken: tokens.refresh_token || inbox.gmailConfig.refreshToken,
            redirectUri: GMAIL_REDIRECT_URI,
        };

        inbox.gmailConfigured = true;
        inbox.status = "active";
        inbox.email = connectedEmail; // 👈 update the email with the connected account

        await db.write();

        res.redirect(`${process.env.CLIENT_URL}/inboxes/${inboxId}?connected=${connectedEmail}`);

    } catch (err) {
        console.error("OAuth callback error:", err);
        res.status(500).send("OAuth failed. Check server logs.");
    }
});

export default router
