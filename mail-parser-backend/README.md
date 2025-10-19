## Mail Parser Platform — Backend (Node.js / Express)

#Overview

This backend powers the Mail Parser Platform, handling email fetching, attachment parsing, data mapping, and import automation.
It uses lowdb (JSON-based storage) and integrates with Gmail via OAuth2 for secure IMAP access.
## Tech Stack

Node.js 18+

Express.js

lowdb (JSON storage)

csv-parse / csv-stringify

Gmail IMAP (XOAUTH2)

Winston (logging)
## Project Structure
mail-parser-platform/
│
├── app.js                   # Entry point
├── routes/                  # Express route definitions
├── controllers/             # Business logic per route
├── services/                # Core modules (IMAP, processor, etc.)
├── config/lowdb.js          # JSON database setup
├── uploads/                 # Incoming email attachments
├── storage/archives/        # Archived processed files
└── db/data.json             # lowdb file

⚡ Setup & Run Locally
npm install
cp .env.example .env
npm start


Default: runs on http://localhost:4000

🔑 Example .env
# Server
APP_PORT=4000
BASE_UPLOAD_DIR=./uploads
POLL_INTERVAL_SECONDS=30
TOKEN_SECRET_KEY=mySuperSecretKey123!

CLIENT_URL=http://localhost:3000

UPLOADS_BASE=./uploads/{mailbox-name}

GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:4000/api/auth/google/callback


 Key Endpoints
Endpoint	Description
/auth/login	User login, returns JWT
/imap/poll	Trigger IMAP fetch for configured mailboxes
/inboxes/*	Manage inbox entries & Gmail configs
/files/*	List, preview, and process email attachments
/imports/*	Handle import logs and CSV → DB inserts
/mappings/*	Define and manage column mappings
 Deployment

Use PM2 or Docker for production.

Mount a persistent volume for uploads/ and db/data.json.

Use HTTPS or reverse proxy (e.g. Nginx).

#default login
admin@gmail.com
password123