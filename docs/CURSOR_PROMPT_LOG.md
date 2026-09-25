# Cursor Prompt Log

Append material development prompts newest first. Never include secrets or PII.

## Entry template

- **Date:**
- **Title:**
- **Summary:**
- **Ticket:**
- **Phase at prompt:**
- **Outcome / commits:**

---

## 2026-09-25 — Make www Ploy a live production application

- **Date:** 2026-09-25
- **Title:** Remove www design-preview mode and prove real data
- **Summary:** Investigate and fix the live Ploy www deployment so normal users receive
  real Cloudflare data and production auth, while preserving hybrid API/OAuth/crons and
  all existing D1/R2/KV resources. Open a PR and do not deploy.
- **Ticket:** None
- **Phase at prompt:** Production hardening
- **Outcome / commits:** Draft PR #57 on `cursor/www-live-production-mode-9a5d`.
  Commits `8c59b8c0` and `e34f3653` establish production routing, live-mode flags,
  hydration env exposure, and dual asset support; final review fixes are pending.
