// import { google } from "googleapis";
// import "dotenv/config"
// const auth = new google.auth.JWT({
//     email: process.env.GOOGLE_CLIENT_EMAIL,
//     key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
//     scopes: ["https://www.googleapis.com/auth/admin.directory.user.readonly"],
//     subject: process.env.GOOGLE_IMPERSONATE_EMAIL,
// });

// const service = google.admin({ version: "directory_v1", auth });

// async function test() {
//     const res = await service.users.list({ customer: "my_customer", maxResults: 1 });
//     console.log(res.data);
// }
// test().catch(console.error);


// 

import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

async function testReadGmail() {
    try {
        const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

        const auth = new google.auth.JWT({
            email: process.env.GOOGLE_CLIENT_EMAIL,
            key: privateKey,
            scopes: [
                "https://www.googleapis.com/auth/gmail.readonly"
            ],
            subject: "sales@centseven.com", // 👈 impersonated user
        });

        const gmail = google.gmail({ version: "v1", auth });

        const res = await gmail.users.messages.list({
            userId: "me",
            maxResults: 5,
        });

        const messages = res.data.messages || [];
        console.log(`✅ Found ${messages.length} messages in sales@centseven.com`);

        for (const m of messages) {
            const msg = await gmail.users.messages.get({ userId: "me", id: m.id });
            const snippet = msg.data.snippet || "(no snippet)";
            console.log(`- ID: ${m.id}`);
            console.log(`  Snippet: ${snippet.substring(0, 100)}...`);
        }

    } catch (err) {
        console.error("❌ Gmail test failed:", err.errors?.[0]?.message || err.message);
    }
}

testReadGmail();
