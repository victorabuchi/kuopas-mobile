# Kuopas Mobile

The Expo/React Native app for Kuopas, porting the same features and content as
the web app (`../kuopas/web`, a Next.js + Prisma/Postgres app) to a native
mobile experience. Screens, copy, and business logic are ported 1:1 from the
web app; nothing here is redesigned or invented.

## Stack

- [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing, same mental model as the web app's Next.js App Router)
- TypeScript, React Native
- `expo-secure-store` for the session token and locale preference

## Features

Resident features of the web app, with the same copy (`lib/dictionary.ts` is
copied verbatim), rules and validation. The web sidebar becomes five bottom
tabs, with the rest under **More**.

| Tab | Screen | Web source |
| --- | --- | --- |
| Feed | News tabs (news/announcements/promotions/discounts/events) and the move-in welcome overlay | `(app)/home`, `MoveInGuideOverlay` |
| Chats | Building, stairwell, floor and apartment group chats | `(app)/chats`, `(app)/chat/[groupId]` |
| Communities | Create, join, leave and chat in public communities | `(app)/communities` |
| Messages | Kuopas chat, announcements (with read receipts), noticeboard (posts, photos, reactions, replies, reports), complaints (with photo and status thread), support contacts, resident DMs | `(app)/messages`, `(app)/complaints`, `(app)/messages/[conversationId]` |
| More | Calls, Booking, Household, Roommates, Marketplace, Lease, Wellbeing, Settings | `(app)/calls`, `booking`, `household`, `roommates`, `marketplace`, `lease`, `wellbeing`, `settings` |

More, in detail:

- **Booking** is the hub: invitations, everything your apartment can book, and your upcoming bookings. It leads to Laundry, Sauna (group turns), Parking and building-defined spaces (common room, gym, study room, grill) with multi-hour and group bookings.
- **Household** has bill splitting with weighted shares and running balances, a chore wheel, and the apartment board (chat messages can be reported).
- **Roommates** is the eight-question matching wizard, ranked matches, connections and messaging (verified residents only).
- **Marketplace** covers sublet and room-swap listings and requests (verified residents only; staff approval happens on the web).
- **Lease** covers the lease and rent schedule, guarantor requests, identity verification (university-email code or a document upload) and My room.
- **Wellbeing** sends a support request with explicit consent to share.
- Complaints accept a photo and a short video.

Sign-in: email/password and Google (opens the web flow, returns to the app
through the `kuopas://auth` deep link).

Not ported (web only): the staff portal and admin pages (including staff review of
verifications, leases, marketplace deals and wellbeing cases), the landing page,
the terms/privacy pages, and web push notifications.

`lib/dictionary.ts`, `lib/living/`, `lib/booking-grid.ts`, `lib/laundry.ts`,
`lib/sauna.ts`, `lib/matching.ts`, `lib/split.ts` and `lib/lease.ts` are verbatim
copies of their web counterparts, so re-copy them when the web versions change.

## Backend: server actions vs. the mobile API

The web app's own pages still run on Next.js server actions (`'use server'`
functions) behind a same-origin, cookie-based session (`kuopas_session`) —
those aren't callable from outside the Next.js app. `kuopas/web` (commit
`19d1fef`, "Add the /api/mobile/* bridge for the Expo app") now also exposes a
parallel `/api/mobile/*` surface that wraps the same Prisma queries and
`src/lib/*-actions.ts` mutations behind a bearer token instead of the cookie,
returning JSON instead of doing a `redirect()`. Response shapes are kept in
`kuopas/web/src/lib/mobile-serializers.ts`, matching `lib/types.ts` here
field-for-field by hand, since the two repos don't share a package. Routes
added for the newer features: `home`, `move-in-guide`, `notices`,
`complaints`, `direct`, `communities`, `laundry`, `sauna`, `parking`,
`feed/read`, `booking`, `household`, `roommates`, `market`, `lease`,
`verification`, `guarantor` and `wellbeing`, plus photo/video (multipart)
support on `feed/posts` and `complaints`. The app sends an `x-kuopas-locale`
header so server-built error messages come back in the app's language.

Booking grids are drawn in the device's time zone (the web draws them in the
server's), so keep the web server on Europe/Helsinki time or bookings made
from a phone can land on a different row on the web.

## Running

```bash
npm install
npm run ios      # or: npm run android / npm run web
```

Point `EXPO_PUBLIC_API_URL` at the web app's dev server. `http://localhost:3000`
only works from the iOS simulator (it shares the host's network); a physical
device needs your machine's LAN IP (e.g. `http://192.168.1.23:3000`), and the
Android emulator needs `http://10.0.2.2:3000`.
