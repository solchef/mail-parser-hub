# 📬 Mail Parser Platform

**Full System Documentation — Version 1.0**
**Date:** October 2025

---

## 🧭 Table of Contents

1. [Executive Summary](#1-executive-summary-client-friendly)
2. [System Architecture (High Level)](#2-system-architecture-high-level)
3. [Project Structure](#3-project-structure)
4. [Environment & Credentials (.env)](#4-environment--credentials-complete-env-guidance)
5. [Backend — Setup & Run](#5-backend--setup--run)
6. [Frontend — Setup & Run](#6-frontend--setup--run)
7. [Google Service Account Setup (Gmail API)](#7-google-service-account-setup-gmail-api)
8. [Mail-in-a-Box Setup](#8-mail-in-a-box-setup)
9. [API Reference](#9-api-reference)
10. [Data Model (lowdb)](#10-data-model-lowdb--skeleton)
11. [Workflows](#11-workflows--end-to-end-behavior)
12. [Deployment & Production Tips](#12-deployment--production-tips)
13. [Monitoring, Logging & Maintenance](#13-monitoring-logging--maintenance)
14. [Troubleshooting Checklist](#14-troubleshooting-checklist)
15. [Appendix](#15-appendix)

---

## 1. Executive Summary (Client-Friendly)

The **Mail Parser Platform** automates the flow of incoming emails → extracting structured attachments (CSV, XLSX, etc.) → validating and mapping → inserting data into target databases or systems.

It includes:

* 🖥️ **Web UI (Next.js / React 19)** for mailbox, mapping, and import management.
* ⚙️ **Backend (Node.js + Express)** handling IMAP fetchers, file parsing, mapping, and import execution.
* 💾 **Lowdb JSON** for lightweight configuration storage and logging.

**Business Benefits**

* Removes manual data entry and CSV handling.
* Provides a central mailbox-to-database pipeline.
* Maintains auditability and data traceability.

---

## 2. System Architecture (High Level)

**Frontend (Next.js 15 / React 19)**

* Manages configuration, dashboards, and import monitoring.
* Communicates with backend via `NEXT_PUBLIC_API_URL`.

**Backend (Node.js + Express)**

* REST API managing users, inboxes, mappings, imports, and database connections.
* Handles email fetching via Gmail API using **Service Account credentials**.
* Parses attachments (CSV), maps fields, and writes to destination databases.

**Storage**

* Uploaded attachments in `/uploads`.
* Archived/processed files in `/storage/archives`.

**Logging**

* Via Winston with rotation (config under `config/winston.js`).

---

## 3. Project Structure

### Backend

```
app.js                  # Main entrypoint
routes/                 # Express route definitions
controllers/            # Business logic
services/               # Core modules (mail-imap.js, processor.js, etc.)
config/                 # Configurations (lowdb, logger, etc.)
middlewares/            # JWT, validation, logging
uploads/                # Incoming files
storage/archives/       # Processed files
db/                     # lowdb JSON file
```

### Frontend

```
app/                    # Next.js routes
components/             # UI components
lib/                    # API helpers
styles/                 # TailwindCSS tokens
public/                 # Static assets
```

---

## 4. Environment & Credentials (Complete .env Guidance)

Below is a **safe example** of the `.env` file used in the **backend** (replace placeholders):

```bash
# Server
APP_PORT=4000
BASE_UPLOAD_DIR=./uploads
POLL_INTERVAL_SECONDS=30
TOKEN_SECRET_KEY=yourSuperSecretKey
CLIENT_URL=http://localhost:3000
UPLOADS_BASE=./uploads/{mailbox-name}

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=mailparser

# Google Service Account (Gmail API)
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_CLIENT_EMAIL=service-account@your_project_id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----
GOOGLE_SCOPES=https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.modify

# Mail-in-a-Box
MIAB_API_URL=https://your-mailinabox-domain.com
MIAB_ADMIN_USER=admin@yourdomain.com
MIAB_ADMIN_PASS=your_strong_password

# Uploads & Storage
STORAGE_LOCATION=gdrive
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
```

> ⚠️ Never commit `.env` files to version control.
> All credentials and keys should be stored securely (e.g. Vault, Cloud Secret Manager, or encrypted env files).

---

## 5. Backend — Setup & Run

**Requirements**

* Node.js 18+
* npm or pnpm
* (Optional) Docker
* Google Cloud Service Account credentials (JSON key)

**Setup Steps**

```bash
# 1. Clone or unzip backend
cd mail-parser-platform

# 2. Install dependencies
npm install

# 3. Create your .env (see above)

# 4. Start the app
npm start
# or production
node app.js &
# or use PM2
pm2 start app.js --name mail-parser
```

> Ensure `uploads/` and `storage/archives/` exist and are writable.

---

## 6. Frontend — Setup & Run

```bash
# 1. Unzip or clone frontend
cd mail-parser-app

# 2. Install deps
pnpm install

# 3. Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api" > .env

# 4. Run development
pnpm dev
# Open http://localhost:3000
```

---

## 7. Google Service Account Setup (Gmail API)

The system now uses a **Google Cloud Service Account** instead of manual OAuth tokens.

### Steps

1. **Create a Google Cloud Project**

   * Go to [Google Cloud Console](https://console.cloud.google.com/).
   * Create a new project or select an existing one.

2. **Enable the Gmail API**

   * Navigate to **APIs & Services → Library**.
   * Search for **“Gmail API”** and click **Enable**.

3. **Create a Service Account**

   * Go to **APIs & Services → Credentials → Create Credentials → Service Account**.
   * Assign a name and role (e.g. *Editor* or *Custom with Gmail access*).

4. **Generate a JSON Key**

   * Under your Service Account → Keys → Add Key → JSON.
   * Download the JSON file securely.
   * Copy its values into your `.env` (use the placeholders shown above).

5. **Assign Domain-Wide Delegation (if reading user Gmail)**

   * Edit the Service Account → Enable **Domain-wide delegation**.
   * In your Google Workspace Admin console, authorize scopes:

     ```
     https://www.googleapis.com/auth/gmail.readonly,
     https://www.googleapis.com/auth/gmail.modify
     ```
   * This allows the service account to impersonate specific mailboxes.

6. **Configure in App**

   * Place the key details in `.env` as shown above.
   * The backend will automatically use these credentials when fetching Gmail emails.

---

## 8. Mail-in-a-Box Setup

Mail-in-a-Box (MIAB) provides a secure, self-hosted mail server you can connect to via IMAP or its admin API.

### A. Deploying Mail-in-a-Box

1. **Prepare a Clean Ubuntu Server (22.04 recommended)**

   ```bash
   ssh root@your-server-ip
   ```

2. **Run the official installer**

   ```bash
   curl -s https://mailinabox.email/setup.sh | bash
   ```

3. **Follow the prompts** to configure:

   * Hostname (e.g. box.yourdomain.com)
   * Admin email
   * Password and DNS setup

4. **Access the Admin UI**

   * Visit: `https://box.yourdomain.com/admin`
   * Log in using the admin credentials you just created.

5. **Add Mailboxes**

   * Add mailbox users for use within the Mail Parser platform.

---

### B. Connecting MIAB to Mail Parser Platform

1. In your backend `.env`, configure:

   ```bash
   MIAB_API_URL=https://box.yourdomain.com
   MIAB_ADMIN_USER=admin@yourdomain.com
   MIAB_ADMIN_PASS=your_strong_password
   ```

2. From the Mail Parser UI:

   * Go to **Inboxes → Add Mailbox → IMAP Source**.
   * Enter IMAP details:

     * Host: `box.yourdomain.com`
     * Port: `993`
     * TLS: true
     * Username: `<your mailbox>`
     * Password: `<mailbox password>`

3. Test connection → Save.
   Your Mail-in-a-Box inbox will now sync automatically through IMAP.

---

## 9. API Reference

**Base URL:**

```
http://localhost:4000/api
```

**Key Endpoints:**

* `POST /auth/login` — User login, returns JWT
* `GET /users` — Manage users
* `GET /files` — List processed or pending files
* `POST /imports/process` — Run import job
* `POST /imap/poll` — Trigger IMAP fetch
* `POST /mail/fetch-mails` — Manual IMAP test
* `GET /mappings` — Retrieve field mappings
* `POST /inboxes` — Add mailbox configuration

(See `routes/` folder for complete endpoint list.)

---

## 10. Data Model (Lowdb) & Skeleton

The backend uses **lowdb** (JSON-based database) for configuration and metadata.

```json
{
  "mailboxes": [],
  "files": [],
  "mappings": [],
  "dbConnections": [],
  "imports": [],
  "archivedFiles": [],
  "users": []
}
```

> Back up `db/data.json` regularly.
> It’s automatically created if missing.

---

## 11. Workflows — End-to-End Behavior

### A. Automatic Inbox Polling

1. Cron or background job triggers IMAP fetcher.
2. Emails retrieved via Gmail API (Service Account) or IMAP.
3. Attachments downloaded to `/uploads`.
4. CSVs parsed → mapped → inserted into destination DBs.
5. Processed files archived to `/storage/archives`.

### B. Manual Import from UI

1. User selects uploaded file.
2. Chooses mapping configuration.
3. App sends `POST /imports/process`.
4. File is processed, validated, and imported.

---

## 12. Deployment & Production Tips

* Secure your `.env` and private keys.
* Ensure `uploads/` and `storage/archives/` are writable and backed up.
* Run under PM2 or systemd for uptime.
* Serve backend via HTTPS (nginx reverse proxy or Cloudflare).
* Rotate keys and tokens periodically.

---

## 13. Monitoring, Logging & Maintenance

* Logs are written via **Winston** in `/logs`.
* Use `pm2 logs` or centralized log collectors.
* Periodically archive or prune logs and uploads.
* Backup `db/data.json` and `.env` regularly.

---

## 14. Troubleshooting Checklist

* **IMAP/Gmail connection fails:**

  * Verify Service Account has valid scopes and delegated access.
* **Import errors:**

  * Check database connection and mapping structure.
* **lowdb corruption:**

  * Restore `db/data.json` from a backup.
* **UI 500 errors:**

  * Ensure backend is reachable and `.env` values match frontend API URL.

---

## 15. Appendix

### A. Sample .env

*(Redacted placeholders — never commit secrets)*
See [Section 4](#4-environment--credentials-complete-env-guidance) for details.

### B. lowdb Example

```json
{
  "mailboxes": [
    {
      "id": "inbox_1",
      "email": "inbox@example.com",
      "displayName": "Example Inbox",
      "serviceType": "gmail",
      "gmailConfig": {
        "projectId": "your_project_id",
        "clientEmail": "service-account@project.iam.gserviceaccount.com",
        "scopes": ["https://www.googleapis.com/auth/gmail.readonly"]
      }
    }
  ]
}
```

# mail-parser-hub
