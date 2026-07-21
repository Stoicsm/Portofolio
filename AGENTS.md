# AGENTS.md

- Static portfolio frontend: `index.html`, `styles.css`, `script.js`. No build step, no bundler.
- Backend: `server/index.js` (Node.js + Express + Nodemailer). Run with `npm start` inside `server/` after `npm install` and configuring `.env`.
- Security: strict CSP meta tag, `connect-src 'self'` for fetch to backend, no external CDN, no inline scripts/styles, rate limiting on `/api/contact`, body size limit 8kb, Helmet headers, path traversal guard on static serving.
- SMTP secrets live in `server/.env` (copied from `.env.example`). `.env` is gitignored. Server exits on missing env vars.
- Contact form sends JSON POST to `/api/contact`; server validates, sanitizes, and forwards to `MAIL_TO` via SMTP. Frontend also validates before sending.
- Images go in `assets/` (profile) and `assets/projects/` (project screenshots). Placeholder paths in HTML; replace with real files.
- Keep frontend JavaScript dependency-free. Server dependencies managed in `server/package.json`.
