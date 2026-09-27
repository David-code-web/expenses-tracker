# Workspace guidance

- This is a Vite + React JavaScript app.
- Persistence is browser-local SQLite via sql.js and IndexedDB; do not describe it as a shared or hosted database.
- Keep deployment static-host compatible (Netlify build output: `dist`).
- PDF reports are generated client-side with jsPDF and filtered by selected dates.
