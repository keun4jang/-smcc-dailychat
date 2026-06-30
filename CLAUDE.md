@AGENTS.md

# SMCC Daily Chat — Claude Code Guide

## Project purpose

This is a **host-curated community operations platform** for SMCC Daily Coffee Chats.
It is NOT a generic booking app or first-come-first-served reservation system.

Core model:
- Hosts/Admins create rooms
- Participants apply (applying ≠ confirmation)
- Hosts/Admins select participants after review
- Maximum 8 confirmed participants per room
- 신청 ≠ 확정. 선착순 아님.

---

## Stack

- Next.js 16 (App Router, server components, server actions)
- TypeScript (strict mode)
- Tailwind CSS v4
- Supabase (Postgres + Auth via @supabase/ssr)
- Google Sheets API (audit log via googleapis)
- Node.js / npm

Free-tier only. Do not introduce paid services.

---

## Core business rules

1. Only HOST or ADMIN can create rooms.
2. Participants can only apply — they cannot confirm themselves.
3. HOST or ADMIN selects participants after review.
4. Maximum 8 CONFIRMED participants per room.
5. Room status goes OPEN → FULL automatically when capacity is reached.
6. CLOSED/FULL/CANCELLED rooms do not appear in the normal open-room listing.
7. ADMIN can view all rooms and all operational data.
8. Feedback is only available to CONFIRMED or ATTENDED participants.
9. Hosts can report participants (severity: NOTE, WARN, REVIEW).

---

## Coding style

- Server components by default — add `"use client"` only when needed
- All data mutations live in `src/app/actions.ts` as server actions
- Supabase admin client (`src/lib/supabase/admin.ts`) is server-only — never import in client components
- Zod for form validation in server actions
- No TypeScript `any` beyond profile/room data shapes (improvement area)
- No comments unless the WHY is non-obvious
- Korean-first bilingual UI: Korean text first, English secondary on the same element
- Stone color palette (stone-50 bg, stone-900 text, stone-600 secondary)
- No separate Korean/English pages — single bilingual UI only

---

## No-secrets rule

- Never commit `.env.local`, API keys, private keys, or tokens
- `.env.example` documents all required variables with placeholder values
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — only used in `admin.ts`
- Google Sheets credentials are server-only

---

## Key file map

| File | Purpose |
|------|---------|
| `src/app/actions.ts` | All server actions (data mutations) |
| `src/app/layout.tsx` | Root layout, nav, auth check |
| `src/app/page.tsx` | Home — list open rooms |
| `src/app/rooms/[id]/page.tsx` | Room detail, apply, feedback |
| `src/app/host/new/page.tsx` | Create room form |
| `src/app/host/rooms/[id]/page.tsx` | Host: review applicants, report |
| `src/app/admin/page.tsx` | Admin dashboard |
| `src/lib/supabase/server.ts` | Server-side Supabase client |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/admin.ts` | Service-role Supabase client (server-only) |
| `src/lib/supabase/update-session.ts` | Middleware session refresh |
| `src/lib/sheets.ts` | Google Sheets audit logger |
| `middleware.ts` | Session refresh on every request |
| `supabase/migrations/0001_init.sql` | DB schema |
| `supabase/migrations/0002_rls.sql` | Row Level Security policies |

---

## Workflow for every session

1. **Inspect** — read relevant files before making changes
2. **Plan** — identify exactly what to change and why
3. **Patch** — make the smallest correct fix
4. **Verify** — run `npm run lint` and `npm run build` if possible
5. **Commit** — clear commit message, push to the designated branch

---

## Beginner-friendly maintenance rule

Keep code readable for someone maintaining this on Windows PowerShell + VS Code with no advanced background. Avoid clever abstractions. Prefer explicit, readable code over concise but opaque patterns.

---

## What NOT to do

- Do not add paid services
- Do not build separate Korean and English versions of pages
- Do not rewrite files that are already working
- Do not add features not requested
- Do not commit secrets
- Do not introduce backend frameworks beyond what's already here
- Do not use `any` for new code unless truly necessary
