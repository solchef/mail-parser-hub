// test-imap.js
import { ImapFlow } from "imapflow";

const client = new ImapFlow({
    host: "box.mailparserhub.com",
    port: 993,
    secure: true,
    auth: {
        user: "www@mailparserhub.com",
        pass: "password"
    }
});

try {
    console.log("Connecting...");
    await client.connect();
    console.log("Connected!");
    await client.logout();
} catch (err) {
    console.error("IMAP Error:", err);
}
