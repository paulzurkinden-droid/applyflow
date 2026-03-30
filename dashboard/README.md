# ApplyFlow — Dashboard

User dashboard for ApplyFlow, the AI-powered job application assistant for the Swiss market.

## Stack

- **React 18** + **Vite** — fast dev server and build tooling
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no config file needed)
- **Supabase** (`@supabase/supabase-js`) — auth (magic link) + database
- **React Router v6** — client-side routing with protected routes

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Magic link authentication (passwordless) |
| `/` | Home | Dashboard overview: stats + recent job alerts |
| `/offres` | Offres | Full job offers list with score filter + apply/ignore actions |
| `/candidatures` | Candidatures | Application tracker with status updates + LM generation |
| `/profil` | Profil | User profile, plan info, CV link |

All routes except `/login` are protected — unauthenticated users are redirected to `/login`.

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://yltajummrsorqvynvod.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Both variables are required. The Supabase anon key is safe to expose in the browser (it's subject to Row Level Security).

## Run Locally

```bash
npm install
cp .env.example .env
# edit .env with your Supabase anon key
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

Output goes to `dist/`. Preview with `npm run preview`.

## Deployment

### Vercel (recommended)

1. Connect your GitHub repo to Vercel
2. Set root directory to `dashboard/`
3. Add env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy — `vercel.json` handles SPA rewrites automatically

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Add env vars in Netlify UI
4. `public/_redirects` handles SPA routing automatically

## Notes

- **Users are not self-registered.** Accounts are created by the **WF-STRIPE** n8n workflow via the Supabase Admin API when a Stripe subscription is activated.
- Authentication uses **magic links** (passwordless OTP via Supabase Auth).
- The LM generation webhook (`/webhook/generate-lm`) is hosted on n8n Cloud and called with the user's Supabase JWT for authorization.
