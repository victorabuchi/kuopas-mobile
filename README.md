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

A working scaffold with real screens wired to a live API layer:

- `app/login.tsx`, `app/register.tsx` — ported from `kuopas/web/src/app/login` and `.../register`
- `app/(tabs)/feed.tsx` — ported from `kuopas/web/src/app/(app)/feed` (announcements/noticeboard tabs, reactions, comments, reports)
- `app/(tabs)/chats.tsx` and `app/chat/[groupId].tsx` — ported from `kuopas/web/src/app/(app)/chats` and `.../chat/[groupId]`
- `lib/dictionary.ts` — copied verbatim from the web app; full English/Finnish strings for every screen, not just the ones wired up so far
- `lib/api-client.ts` — typed client for the `/api/mobile/*` JSON API

## Backend: server actions vs. the mobile API

The web app's own pages still run on Next.js server actions (`'use server'`
functions) behind a same-origin, cookie-based session (`kuopas_session`) —
those aren't callable from outside the Next.js app. `kuopas/web` (commit
`19d1fef`, "Add the /api/mobile/* bridge for the Expo app") now also exposes a
parallel `/api/mobile/*` surface that wraps the same Prisma queries and
`src/lib/*-actions.ts` mutations behind a bearer token instead of the cookie,
returning JSON instead of doing a `redirect()`. Response shapes are kept in
`kuopas/web/src/lib/mobile-serializers.ts`, matching `lib/types.ts` here
field-for-field by hand, since the two repos don't share a package — tested
end to end against the dev DB (login/register, buildings, `/me`, the full
feed loop, the full chats loop, and a 401 on an unauthenticated request).

## Running

```bash
npm install
npm run ios      # or: npm run android / npm run web
```

Point `EXPO_PUBLIC_API_URL` at the web app's dev server. `http://localhost:3000`
only works from the iOS simulator (it shares the host's network); a physical
device needs your machine's LAN IP (e.g. `http://192.168.1.23:3000`), and the
Android emulator needs `http://10.0.2.2:3000`.
