import { v4 as uuidv4 } from "uuid";
import { format, subDays } from "date-fns";
import { MailboxModel } from "../models/mailbox.model.js";
import { FileModel } from "../models/file.model.js";
import { ensureGoogleWorkspaceUser } from "../services/gmail-admin.js";
import { ensureMailinaboxUser } from "../services/imap-admin.js";
import {
    testGmailConnectionService,
    updateGmailConfigService,
    getGmailConfigService,
} from "../services/gmail-config.js";


// ------------------- GET ALL -------------------
export async function getAllInboxes(req, res) {
    try {
        const inboxes = await MailboxModel.all();
        const files = await FileModel.all();


        const result = inboxes.map((inbox) => {
            const inboxFiles = files.filter(f => f.mailbox === inbox.email);

            const emailsLast30Days = inboxFiles.length;
            const processedFiles = inboxFiles.filter(f => f.status === "processed").length;
            const failedFiles = inboxFiles.filter(f => f.status === "failed").length;
            const pendingFiles = inboxFiles.filter(f => f.status === "pending").length;

            const lastReceivedFile = inboxFiles.sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0];
            const lastReceived = lastReceivedFile
                ? new Date(lastReceivedFile.date).toISOString()
                : "N/A";

            return {
                ...inbox,
                emailsLast30Days,
                processedFiles,
                failedFiles,
                pendingFiles,
                lastReceived,
            };
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch inboxes" });
    }
}


// ------------------- GET ONE -------------------
export async function getInboxById(req, res) {
    try {
        const inbox = await MailboxModel.findById(req.params.id);
        if (!inbox) return res.status(404).json({ message: "Inbox not found" });

        const inboxFiles = await FileModel.findBy("mailbox", inbox.email);
        const emailsLast30Days = inboxFiles.length;
        const processedFiles = inboxFiles.filter(f => f.status === "processed").length;
        const failedFiles = inboxFiles.filter(f => f.status === "failed").length;
        const pendingFiles = inboxFiles.filter(f => f.status === "pending").length;

        const lastReceivedFile = inboxFiles.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        const lastReceived = lastReceivedFile
            ? new Date(lastReceivedFile.date).toISOString()
            : "N/A";

        res.json({
            ...inbox,
            emailsLast30Days,
            processedFiles,
            failedFiles,
            pendingFiles,
            lastReceived,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch inbox" });
    }
}


// ------------------- CREATE -------------------
export async function createInbox(req, res) {
    try {
        const { name, email, type, gmailConfig, imapConfig } = req.body;

        if (!name || !email)
            return res.status(400).json({ message: "Name and email are required" });

        if (!type || !["gmail", "imap"].includes(type))
            return res.status(400).json({ message: "Invalid mailbox type (must be 'gmail' or 'imap')" });

        const newInbox = {
            id: uuidv4(),
            name,
            email,
            status: "active",
            type,
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ').slice(0, 19).replace('T', ' '),
            uploadsBase: `./uploads/${name.toLowerCase().replace(/\s/g, "-")}`,
        };

        if (type === "gmail") {
            await ensureGoogleWorkspaceUser(email, gmailConfig?.password);

            newInbox.gmailConfig = JSON.stringify({
                configured: true,
                clientId: process.env.GMAIL_CLIENT_ID || "",
                clientSecret: process.env.GMAIL_CLIENT_SECRET || "",
                refreshToken: "",
                redirectUri: process.env.GMAIL_REDIRECT_URI || "",
            });
            newInbox.imapConfig = null;
        } else if (type === "imap") {
            if (!imapConfig?.host || !imapConfig?.user || !imapConfig?.password) {
                return res.status(400).json({ message: "IMAP config requires host, user, and password" });
            }

            if (imapConfig.host.includes("mailparserhub.com")) {
                await ensureMailinaboxUser(imapConfig.user, imapConfig.password);
            }

            newInbox.gmailConfig = null;
            newInbox.imapConfig = imapConfig;
        }

        await MailboxModel.create(newInbox);
        res.status(201).json(newInbox);

    } catch (err) {
        console.error("❌ createInbox error:", err);
        res.status(500).json({ message: "Failed to create inbox" });
    }
}


// ------------------- UPDATE -------------------
export async function updateInbox(req, res) {
    try {
        const { id } = req.params;
        const { name, email, type, gmailConfig, imapConfig, status } = req.body;

        const existing = await MailboxModel.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Inbox not found" });
        }

        if (type && !["gmail", "imap"].includes(type)) {
            return res.status(400).json({ message: "Invalid mailbox type" });
        }

        const updateData = {
            ...(name && { name }),
            ...(email && { email }),
            ...(type && { type }),
            ...(status && { status }),
        };

        if (type === "gmail" || (gmailConfig && !imapConfig)) {
            updateData.gmailConfig = JSON.stringify({
                configured: true,
                clientId: gmailConfig?.clientId || process.env.GMAIL_CLIENT_ID || "",
                clientSecret: gmailConfig?.clientSecret || process.env.GMAIL_CLIENT_SECRET || "",
                refreshToken: gmailConfig?.refreshToken || "",
                redirectUri: gmailConfig?.redirectUri || process.env.GMAIL_REDIRECT_URI || "",
            });
            updateData.imapConfig = null;
        }

        if (type === "imap" || imapConfig) {
            if (!imapConfig?.host || !imapConfig?.user || !imapConfig?.password) {
                return res.status(400).json({ message: "IMAP config requires host, user, and password" });
            }

            updateData.imapConfig = JSON.stringify({
                host: imapConfig.host,
                port: imapConfig.port || 993,
                tls: imapConfig.tls ?? true,
                user: imapConfig.user,
                password: imapConfig.password,
            });
            updateData.gmailConfig = null;
        }

        await MailboxModel.update(id, updateData);
        const updated = await MailboxModel.findById(id);
        res.status(200).json(updated);

    } catch (err) {
        console.error("❌ updateInbox error:", err);
        res.status(500).json({ message: "Failed to update inbox" });
    }
}


// ------------------- DELETE -------------------
export async function deleteInbox(req, res) {
    try {
        const deleted = await MailboxModel.remove(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Inbox not found" });
        res.json({ message: "Inbox deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete inbox" });
    }
}


// ------------------- ANALYTICS -------------------
export async function getInboxAnalytics(req, res) {
    try {
        const { id } = req.params;
        const inbox = await MailboxModel.findById(id);
        if (!inbox) return res.status(404).json({ message: "Inbox not found" });

        const inboxFiles = await FileModel.findBy("mailbox", inbox.email);
        const thirtyDaysAgo = subDays(new Date(), 30);

        const emailsLast30Days = inboxFiles.filter(f => new Date(f.createdAt) >= thirtyDaysAgo).length;
        const processedFiles = inboxFiles.filter(f => f.status === "processed").length;
        const failedFiles = inboxFiles.filter(f => f.status === "failed").length;
        const totalRecordsImported = inboxFiles.reduce(
            (sum, f) => sum + (f.recordsImported || 0),
            0
        );

        const chartMap = {};
        for (const f of inboxFiles) {
            const createdAt = new Date(f.createdAt);
            if (createdAt >= thirtyDaysAgo) {
                const dateKey = format(createdAt, "MMM d");
                chartMap[dateKey] = (chartMap[dateKey] || 0) + 1;
            }
        }

        const chartData = Object.entries(chartMap).map(([date, emails]) => ({
            date,
            emails,
        }));

        res.json({
            emailsLast30Days,
            processedFiles,
            failedFiles,
            totalRecordsImported,
            chartData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch inbox analytics" });
    }
}


// ------------------- GMAIL CONFIG -------------------
export async function updateInboxGmailConfig(req, res) {
    try {
        const { id } = req.params;
        const config = req.body;
        const result = await updateGmailConfigService(id, config);
        res.json({
            success: true,
            message: `Gmail connected successfully to ${result.connectedEmail}`,
            email: result.connectedEmail,
            gmailConfig: result.gmailConfig,
        });
    } catch (error) {
        console.error("Failed to update Gmail config:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}


// ------------------- TEST CONNECTION -------------------
export async function testGmailConnection(req, res) {
    try {
        const result = await testGmailConnectionService(req.params.id);
        res.json({
            success: true,
            message: `Gmail connection successful for ${result.email}`,
            profile: result.profile,
        });
    } catch (error) {
        console.error("Gmail connection test failed:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to connect to Gmail",
            error: error.message,
        });
    }
}


// ------------------- GET GMAIL CONFIG -------------------
export async function getInboxGmailConfig(req, res) {
    try {
        const config = await getGmailConfigService(req.params.id);
        res.json(config);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to get Gmail config" });
    }
}
