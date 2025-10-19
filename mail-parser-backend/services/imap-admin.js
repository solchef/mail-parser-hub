import axios from "axios";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });

export async function ensureMailinaboxUser(email, password) {
    try {
        const listResp = await axios.get(
            `${process.env.MIAB_API_URL}/admin/mail/users?format=json`,
            {
                auth: {
                    username: process.env.MIAB_ADMIN_USER,
                    password: process.env.MIAB_ADMIN_PASS,
                },
                httpsAgent: agent,
            }
        );

        const exists = Array.isArray(listResp.data) &&
            listResp.data.some((u) => u.email === email);

        if (exists) {
            console.log(`[MIAB] Mailbox ${email} already exists.`);
            return { exists: true };
        }

        console.log(`[MIAB] Creating mailbox ${email}...`);
        await axios.post(
            `${process.env.MIAB_API_URL}/admin/mail/users/add`,
            new URLSearchParams({ email, password }).toString(),
            {
                auth: {
                    username: process.env.MIAB_ADMIN_USER,
                    password: process.env.MIAB_ADMIN_PASS,
                },
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                httpsAgent: agent,
            }
        );

        console.log(`[MIAB] Created ${email}`);
        return { created: true };
    } catch (err) {
        console.error("❌ MIAB error:", err.response?.data || err.message);
        throw err;
    }
}

export async function deleteMailinaboxUser(email) {
    try {
        const res = await axios.post(
            `${process.env.MIAB_API_URL}/admin/mail/users/remove`,
            new URLSearchParams({ email }).toString(),
            {
                auth: {
                    username: process.env.MIAB_ADMIN_USER,
                    password: process.env.MIAB_ADMIN_PASS,
                },
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                httpsAgent: agent,
            }
        );
        console.log(`[MIAB] Deleted ${email}`);
        return { deleted: true, data: res.data };
    } catch (err) {
        if (err.response?.status === 404)
            return { deleted: false, message: "User not found" };
        throw err;
    }
}
