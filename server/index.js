import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const STATIC_ROOT = resolve(__dirname, "..");

const PORT = parseInt(process.env.PORT || "3000", 10);
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_TO = process.env.MAIL_TO;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_TO) {
  console.error("Missing env: SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_TO");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

const app = express();

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(express.json({ limit: "8kb" }));

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

app.use((req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD") {
    let filePath = req.path === "/" ? "/index.html" : req.path;
    const resolved = resolve(STATIC_ROOT, "." + filePath);
    if (!resolved.startsWith(STATIC_ROOT)) {
      return res.status(403).end();
    }
    if (existsSync(resolved)) {
      const ext = extname(resolved).toLowerCase();
      const mime = MIME[ext] || "application/octet-stream";
      res.setHeader("Content-Type", mime);
      res.setHeader("X-Content-Type-Options", "nosniff");
      return res.send(readFileSync(resolved));
    }
  }
  next();
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Terlalu banyak permintaan. Coba lagi dalam 15 menit." },
  standardHeaders: true,
  legacyHeaders: false
});

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitize = (str) => String(str).replace(/[<>&"']/g, (c) => ({
  "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;", "'": "&#39;"
}[c]));

app.post("/api/contact", contactLimiter, async (req, res) => {
  const { name, email, message } = req.body || {};

  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
    return res.status(400).json({ error: "Nama harus 2-80 karakter." });
  }
  if (typeof email !== "string" || !emailRe.test(email.trim()) || email.trim().length > 120) {
    return res.status(400).json({ error: "Email tidak valid." });
  }
  if (typeof message !== "string" || message.trim().length < 10 || message.trim().length > 800) {
    return res.status(400).json({ error: "Pesan harus 10-800 karakter." });
  }

  const safeName = sanitize(name.trim());
  const safeEmail = sanitize(email.trim());
  const safeMessage = sanitize(message.trim());

  try {
    await transporter.sendMail({
      from: `"Portofolio Contact" <${SMTP_USER}>`,
      to: MAIL_TO,
      replyTo: email.trim(),
      subject: `Pesan portofolio dari ${safeName}`,
      text: `Dari: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`,
      html: `<p><strong>Dari:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><hr/><p>${safeMessage.replace(/\n/g, "<br/>")}</p>`
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Mail error:", err.message);
    res.status(500).json({ error: "Gagal mengirim email. Coba lagi nanti." });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT || 3000}`);
});
