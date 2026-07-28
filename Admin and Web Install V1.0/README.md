# 6amStudio — AI Image Editing Platform

A self-hosted, AI-powered image editor. Users upload photos and transform them with
natural-language prompts, one-click effects, and reusable templates — powered by
Google Gemini and OpenAI image models. Credit-based billing, a full admin panel,
and a documented REST API are built in.

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript
- **Database:** MySQL via Prisma ORM
- **Auth:** Auth.js v5 (email + password, optional Google OAuth)
- **AI:** Vercel AI SDK — Google Gemini & OpenAI providers, configured per model in the admin panel
- **Payments:** Stripe (extensible gateway registry)
- **Email:** Nodemailer (SMTP, admin-configured)
- **Styling:** Tailwind CSS

## Quick start (development)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — every route redirects to the
**install wizard** until setup completes. The wizard checks server requirements,
connects MySQL (writes `DATABASE_URL` into the env files itself), seeds system data,
and creates the super admin. License activation is skipped on localhost.

There is nothing to configure by hand: env templates ship with empty
`DATABASE_URL`/`AUTH_SECRET` (the wizard fills the first, first boot generates the
second), and all API keys (AI models, SMTP, Stripe, OAuth, Firebase) are entered in
the admin panel at `/admin`, not in env files.

## Production

```bash
# 1. Set your domain BEFORE building (baked in at build time —
#    used in email links and payment redirects)
#    .env.production → NEXT_PUBLIC_APP_URL="https://your-domain.com"

npm install
npm run build

# 2. Start
npm run start                      # or:
pm2 start ecosystem.config.js      # single fork instance on port 3000

# 3. Open the domain and walk through the install wizard,
#    then sign in at /admin/login
```

See **[INSTALLATION.md](INSTALLATION.md)** for the full install-gate architecture,
wizard flow, and shipping checklist.

## Surfaces

| Surface | URL | What |
|---------|-----|------|
| User app | `/` | Dashboard, AI editor, projects, gallery, history, billing, notifications, settings |
| Admin panel | `/admin` | Users, plans, AI models, effects, templates, prompts, mail templates, SMTP, payment gateways, OAuth, Firebase, branding, languages, audit log |
| REST API | `/api/v1` | JWT-authenticated; OpenAPI docs at `/api-docs` (development mode only) |
| Install wizard | `/install` | Mandatory first-run setup; seals itself after completion |

## Project layout

```
src/
├─ app/
│  ├─ (auth)/                  # login, register, forgot/reset password, verify email
│  ├─ (user)/                  # dashboard, editor/[id], projects, gallery, history,
│  │                           # activity, billing, notifications, settings
│  ├─ (admin)/admin/           # admin panel (separate login + account system)
│  ├─ install/                 # install wizard UI
│  ├─ api/                     # v1 (public API), admin, auth, billing, install
│  ├─ api-docs/                # OpenAPI reference (dev mode)
│  └─ storage/[...path]/       # serves runtime-uploaded files in production
├─ features/install/           # install gate, wizard backend, license activation
├─ components/                 # UI primitives + feature components
├─ config/                     # theme tokens (theme.ts), env accessors
├─ lib/                        # prisma client, mailer, storage, ai, helpers
├─ auth.ts / auth.config.ts    # Auth.js config (full / edge-safe)
└─ middleware.ts               # install gate first, then auth

prisma/
├─ schema/                     # one .prisma file per model
└─ seeds/                      # export-only seed modules + run.ts runner

public/storage/                # uploaded & generated images (back this up)
auto_builder.sh                # packages dist/ install + update zips
ecosystem.config.js            # PM2 config
```

## Scripts

| Command | What |
|---------|------|
| `npm run dev` | Dev server (`.env.development`) |
| `npm run build` | `prisma generate` + `next build` (`.env.production`) |
| `npm run start` | Serve the production build |
| `npm run db:push` | Sync Prisma schema to the dev DB |
| `npm run db:studio` | Prisma Studio GUI |
| `npm run db:seed` | Dev-only full seed (installation record + demo user) |
| `npm run seed:<name>` | Re-run one seeder: `prompts`, `effects`, `mail-templates`, `stripe`, `twilio` |

## Packaging a release

```bash
sh auto_builder.sh
```

Produces `dist/6amStudio-install-v<version>.zip` (full source, sanitized env
templates) and `dist/6amStudio-update-v<version>.zip` (same, minus env files so a
buyer's config is never overwritten). Before shipping: set the real `SOFTWARE_ID`
in `src/features/install/config.ts` and bump `INSTALL_VERSION`.

## Theming

Brand name, logo, and colors are runtime settings (Admin → Branding). The
underlying palette lives in `src/config/theme.ts` as plain hex values — every
tint and opacity variant is derived automatically.
