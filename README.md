# Daily Ledger — Personal Expenses Tracker

A responsive React app for tracking day-to-day income and expenses. Records are stored in a local SQLite database compiled to WebAssembly and persisted in IndexedDB, so there is no API server or managed database to operate. Entries stay in the current browser/device.

## Features

- Add, edit, search, and delete transactions.
- Track income and expense categories, including utility, project, and product load.
- View income, expenses, and net balance for this month, the last 30 days, or all time.
- Export a PDF report with totals and transaction rows for a selected date range.
- Responsive layout; static-build friendly for Netlify.

## Run locally

Install Node.js 20.19+ (or 22.12+) and npm, then run:

```sh
npm install
npm run dev
```

Vite prints the local development URL. To verify a production build:

```sh
npm run build
npm run preview
```

## Publish on Netlify

Connect the repository in Netlify and use:

- Build command: `npm run build`
- Publish directory: `dist`

The provided `netlify.toml` contains the same build settings. No environment variables or server-side functions are required.

## SQLite and privacy notes

The app uses sql.js (SQLite compiled to WebAssembly). Its database is persisted in IndexedDB on the user's device and browser. It is not a shared/cloud SQLite database: records do not automatically sync between devices, browsers, or users. Clearing site storage removes local records, so use the PDF export to retain reports. For multi-device sync or account authentication, a hosted API/database (such as a managed Postgres service) would be required.
