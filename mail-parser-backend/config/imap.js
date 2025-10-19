// config/imap.js
export function getImapConfig(userEmail, password) {
    return {
        imap: {
            user: userEmail,
            password,
            host: "box.mailparserhub.com",
            port: 993,
            tls: true,
            authTimeout: 10000,
        },
    };
}
