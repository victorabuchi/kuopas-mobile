# Kuopas Mobile

The Expo/React Native app for Kuopas, porting the same features and content as
the web app (`../kuopas/web`, a Next.js + Prisma/Postgres app) to a native
mobile experience. Screens, copy, and business logic are ported 1:1 from the
web app; nothing here is redesigned or invented.

## Stack

- [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing, same mental model as the web app's Next.js App Router)
- TypeScript, React Native
- `expo-secure-store` for the session token and locale preference

## What's in this first commit

A working scaffold with real screens wired to a not-yet-built API layer:

- `app/login.tsx`, `app/register.tsx` — ported from `kuopas/web/src/app/login` and `.../register`
- `app/(tabs)/feed.tsx` — ported from `kuopas/web/src/app/(app)/feed` (announcements/noticeboard tabs, reactions, comments, reports)
- `app/(tabs)/chats.tsx` and `app/chat/[groupId].tsx` — ported from `kuopas/web/src/app/(app)/chats` and `.../chat/[groupId]`
- `lib/dictionary.ts` — copied verbatim from the web app; full English/Finnish strings for every screen, not just the ones wired up so far
- `lib/api-client.ts` — typed client for a `/api/mobile/*` JSON API

## Backend gap: server actions vs. a mobile API

The web app has no REST/JSON endpoints today — every mutation and query goes
through Next.js server actions (`'use server'` functions) tied to a
same-origin, cookie-based session (`kuopas_session`). Server actions aren't
meant to be called from outside the Next.js app, so the mobile client can't
reuse them directly.

`lib/api-client.ts` calls a `/api/mobile/*` surface that mirrors each server
action's logic and field names exactly (see the comment above each function
for which web file it corresponds to), but those routes don't exist in the
web repo yet. Before this app can talk to real data, `kuopas/web` needs route
handlers under `src/app/api/mobile/` that:

- Authenticate via a bearer token instead of the `kuopas_session` cookie
- Wrap the same Prisma queries/mutations already in `src/lib/*-actions.ts`
- Return JSON instead of doing a `redirect()`

## Running

```bash
npm install
npm run ios      # or: npm run android / npm run web
```

Set `EXPO_PUBLIC_API_URL` (defaults to `http://localhost:3000`) to point at
the web app's dev server once the `/api/mobile/*` routes exist.
