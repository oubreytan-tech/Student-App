# Angular + Spring Boot Clone — Status Report



## Repository Layout

```
univen-anguler-app/
├── compose.yaml          ← Docker Compose (Postgres + backend + frontend)
├── .env.example          ← All required secrets documented
├── frontend/             ← Angular 21 app
│   ├── src/app/
│   │   ├── app.component.ts / .html   ← Main shell (all tabs + all dialogs)
│   │   ├── login.component.*          ← Dark login screen
│   │   ├── account.component.ts       ← Email provider connect / unlink
│   │   ├── records.component.ts       ← Portal records & residence
│   │   ├── requests.component.*       ← My Requests view
│   │   ├── call.component.ts          ← Log a Call form
│   │   ├── portal.store.ts            ← Signal-based state + API client
│   │   ├── catalog.ts                 ← Services directory (reused)
│   │   └── shared/                    ← icon, modal, statementExport
│   └── package.json      ← Angular 21, jsPDF, Playwright
└── backend/              ← Spring Boot 4.1 / Java 21
    └── src/main/java/za/ac/univen/clone/
        ├── StudentApplication.java
        ├── WebSecurity.java           ← CSRF-off, origin check, error handler
        ├── ApiProblem.java            ← Typed HTTP errors
        ├── Data.java                  ← JSON helpers
        ├── PortalHttp.java            ← Jsoup HTTP client for Univen portal
        ├── PortalParser.java          ← HTML → PortalScrapedPayload
        ├── PortalSession.java         ← Login, keep-alive, logout session store
        ├── PortalController.java      ← /api/scrape/* endpoints
        ├── AccountController.java     ← /api/account/* endpoints
        ├── AccountRepository.java     ← JDBC account & ticket storage
        ├── MailService.java           ← Gmail/Graph email send/read
        └── ProviderHttp.java          ← Allowlisted HTTPS client for OAuth
```

## What is Built ✅

| Feature | Status |
|---------|--------|
| Angular 21 standalone app | ✅ Compiles |
| Login screen (dark, Univen branded) | ✅ |
| Home dashboard (blue/amber hero card) | ✅ |
| Services directory with search & filter | ✅ |
| Log a Call form | ✅ |
| My Requests view | ✅ |
| Profile tab (biographical + contact edit) | ✅ |
| Proof of Registration dialog (PDF iframe) | ✅ |
| Statement of Account dialog (3 tabs + PDF export) | ✅ |
| Exam Results dialog (PDF export) | ✅ |
| Exam Admission Slip dialog (PDF iframe & export) | ✅ |
| Portal Records / Residence dialog | ✅ |
| Digital Student Card dialog | ✅ |
| Notification bell | ✅ |
| Session keep-alive (2 min ping) | ✅ |
| Spring Boot portal scraper | ✅ |
| Spring Boot OAuth account flow | ✅ |
| Gmail + Microsoft Graph mail send | ✅ |
| JDBC account + ticket storage (H2 dev / Postgres prod) | ✅ |
| Docker Compose full-stack | ✅ |

## What Still Needs Live Verification ⚠️

| Item | Note |
|------|------|
| Live portal login | Requires a real student number + PIN |
| Email delivery (Gmail) | Needs `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` |
| Email delivery (Microsoft) | Needs `MICROSOFT_CLIENT_ID/SECRET/TENANT_ID` |
| Proof-of-registration PDF | Portal must return `application/pdf` |
| Production Postgres | Set `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD` |

## How to Run Locally (Angular dev server only)

```powershell
# 1. Install deps (once)
cd univen-anguler-app/frontend
npm install

# 2. Start the backend (separate terminal)
cd ../backend
# requires Java 21 on PATH, or use the bundled .tools/java-unpacked JDK
../.tools/java-unpacked/bin/mvn spring-boot:run   # or mvn wrapper if present

# 3. Start Angular dev server (proxies /api → backend :8080)
cd ../frontend
npm start
# → http://localhost:4200
```

## How to Run with Docker Compose

```powershell
cd univen-anguler-app
copy .env.example .env
# Fill in .env secrets
docker compose up --build
# → http://localhost:4200
```

## Open Questions / Next Steps

1. **OAuth credentials** — add Google/Microsoft client IDs to `.env` so the email account connection works.
2. **`APP_ACCOUNT_KEY`** — generate a 32-byte random key: `openssl rand -base64 32` (used for HMAC session binding).
3. **`COOKIE_SECURE=true`** — set this when deploying behind HTTPS.
4. **Playwright e2e tests** — currently skeleton; can be expanded for full login → dashboard flow.
5. **Mobile frame toggle** — the `[frame]` layout mode wraps the app in a phone frame (430 px); toggled by the 📱 button in the header.
