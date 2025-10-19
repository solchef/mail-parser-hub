Mail Parser App — Frontend (Next.js / React 19)
Overview

The frontend provides an admin dashboard for managing inboxes, imports, mappings, and file processing.
It communicates with the backend API via REST (NEXT_PUBLIC_API_URL).

Tech Stack

Next.js 15 (App Router)

React 19

TailwindCSS

Axios (API requests)

React Query / SWR (data fetching)

Project Structure
mail-parser-app/
│
├── app/                     # Pages (dashboard, inboxes, mappings, etc.)
├── components/              # Reusable UI elements
├── lib/                     # API utilities & helpers
├── public/                  # Static assets
└── styles/                  # TailwindCSS

Setup & Run Locally
pnpm install
cp .env.example .env
pnpm dev


Default: runs on http://localhost:3000

#default login
admin@gmail.com
password123

 Example .env
NEXT_PUBLIC_API_URL=http://localhost:4000

Basic Usage

Login via the UI (/login).

Add a Gmail inbox and test connection.

Upload or view fetched files.

Define a mapping (CSV → DB table).

Run import manually or let the backend auto-process via polling.

Deployment

Recommended: Vercel, Render, or Docker.

Ensure NEXT_PUBLIC_API_URL points to the deployed backend endpoint.