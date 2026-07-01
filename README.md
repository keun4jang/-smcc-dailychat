# SMCC Daily Chat

커뮤니티 운영용 데일리 커피챗 플랫폼 / Community operations platform for SMCC Daily Coffee Chats.

---

## What this app does

SMCC Daily Chat is a host-curated community ops tool for managing small-group coffee chat meetups.

- Hosts or Admins create rooms (meetups)
- Participants browse open rooms and **apply** — applying is NOT a confirmation
- Hosts or Admins review applicants and **select** who participates
- Maximum 8 confirmed participants per room
- This is **NOT first-come-first-served** — host review determines who is accepted
- After events, participants can leave feedback
- Hosts can report problematic participants
- Admins can view stats, reports, and feedback across all rooms
- All key events are logged to Google Sheets for operational visibility

---

## Stack

| Tool | Purpose |
|------|---------|
| Next.js 16 (App Router) | Web framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| Supabase | Database + Auth (free tier) |
| Google Sheets API | Audit logging / export |
| GitHub | Version control |

Everything is free-tier friendly.

---

## Roles

| Role | What they can do |
|------|-----------------|
| USER | Browse rooms, apply, leave feedback |
| HOST | Everything USER can + create rooms, review applicants, report participants |
| ADMIN | Everything HOST can + view admin dashboard, manage all rooms |

Role is set in the `profiles` table in Supabase. Newly registered users get `USER` by default. To promote someone to HOST or ADMIN, update their role in the Supabase Table Editor.

---

## How rooms work

```
HOST creates room (status: OPEN)
  ↓
Participants apply (status: APPLIED — not confirmed)
  ↓
HOST reviews and selects up to 8 participants (status: CONFIRMED)
  ↓
Room becomes FULL when 8 confirmed / stays OPEN otherwise
  ↓
After event: participants marked ATTENDED or NOSHOW
  ↓
Confirmed/Attended participants can leave feedback
HOST can report participants
```

---

## Local setup (Windows PowerShell + VS Code)

### 1. Clone the repo

```powershell
git clone https://github.com/keun4jang/-smcc-dailychat.git
cd -smcc-dailychat
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Set up environment variables

```powershell
copy .env.example .env.local
```

Open `.env.local` in VS Code and fill in the values. See sections below for where to find each value.

### 4. Run locally

```powershell
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Environment variables

All required variables are documented in `.env.example`. Never commit `.env.local`.

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API → anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Cloud → IAM → Service Accounts |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | From the downloaded service account JSON key |
| `GOOGLE_SHEETS_ID` | From your Google Sheet URL |

---

## Supabase setup

1. Go to https://supabase.com and create a free project.
2. In the SQL Editor, run `supabase/migrations/0001_init.sql` to create tables and views.
3. Run `supabase/migrations/0002_rls.sql` to enable Row Level Security.
4. Go to Authentication → Providers and enable **Google** and **Kakao**.
5. Add your OAuth callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`

---

## Google OAuth setup

1. Go to https://console.cloud.google.com
2. Create a project (or use an existing one)
3. Enable the Google+ API or People API
4. Go to Credentials → Create OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback`
6. Copy the Client ID and Client Secret into Supabase → Auth → Providers → Google

---

## Kakao OAuth setup

1. Go to https://developers.kakao.com
2. Create an application
3. Go to Kakao Login → Activate
4. Set Redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
5. Enable OpenID Connect if prompted
6. Copy the REST API key (Client ID) and enable Client Secret in Supabase → Auth → Providers → Kakao

---

## Google Sheets setup (optional, for audit logging)

1. Go to https://console.cloud.google.com
2. Enable the Google Sheets API for your project
3. Go to IAM → Service Accounts → Create a service account
4. Download the JSON key file
5. Create a Google Spreadsheet and share it with the service account email (Editor access)
6. Copy the spreadsheet ID from the URL into `GOOGLE_SHEETS_ID`
7. The app will auto-create these sheets as needed:
   - `profiles_log`
   - `rooms_log`
   - `applications_log`
   - `feedback_log`
   - `reports_log`

If `GOOGLE_SERVICE_ACCOUNT_EMAIL` or `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` are missing, logging is silently skipped — the app still works.

---

## Routes

| Route | Who can access | Purpose |
|-------|---------------|---------|
| `/` | Everyone | Browse open rooms |
| `/login` | Guests | OAuth login |
| `/auth/callback` | System | OAuth redirect |
| `/onboarding` | Logged-in users | Complete profile |
| `/rooms/[id]` | Everyone | Room detail + apply |
| `/host/new` | HOST, ADMIN | Create a room |
| `/host/rooms/[id]` | HOST (own room), ADMIN | Review applicants |
| `/admin` | ADMIN | Dashboard + reports |

---

## What still needs to be done

- [ ] Email notifications (no email triggers set up yet)
- [ ] Image upload / avatar support
- [ ] User-facing form validation error messages (currently throws server errors)
- [ ] Rate limiting on applications and feedback
- [ ] Account deletion flow
- [ ] Vercel deployment configuration
- [ ] Automated Supabase backup policy

---

## Continuing with Claude Code on the web

1. Open https://claude.ai/code
2. Connect this GitHub repo
3. Start a session — Claude will read `CLAUDE.md` and `AGENTS.md` automatically
4. Ask Claude to continue from the current state of the repo

---

## Project notes

- UI is Korean-first, English secondary (same screen, not separate apps)
- All business logic mutations are in `src/app/actions.ts` (server actions)
- Supabase admin client (`src/lib/supabase/admin.ts`) is server-only
- Google Sheets logging is best-effort — failures don't block the app
