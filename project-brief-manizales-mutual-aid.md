# Project Brief: Afán Sí Tengo

**Short description:** Afán Sí Tengo ("Now I DO have urgency") is a zero-login web app connecting people who need help with people who can give it, built for Manizales after the August 2026 earthquake. No accounts, no ratings — just urgent needs and neighbors who show up. The name inverts Manizales influencer Camilo Cifuentes' well-known "Yo afán no tengo" ("I'm in no rush") — his phrase is about generosity with time to spare; this is the opposite moment, someone who needs help right now.

## Context

A magnitude 7.4 earthquake struck Chocó, Colombia on August 10, 2026. In Manizales specifically: 5 confirmed dead, 60 buildings with total or partial collapse (including a tower of the Cathedral Basilica), roughly 2,000–4,000 people affected, and 150+ people currently in the Coliseo Mayor shelter. This is a live, fast-moving situation, and many people have unreliable internet access — the platform has to be usable within hours and with zero friction.

## Design Principle: Zero Friction

No accounts. No login. No signup form. Anyone landing on the page can act immediately. This shapes every decision below — every feature is evaluated against "does this add a step between landing on the page and getting or giving help."

Trust is handled socially, not mechanically: people are trusting each other directly because of the shared crisis, not because a badge system vouches for them. Sharing a phone/WhatsApp number on a post is optional, left to the poster's judgment.

## Landing Page — 3 Options

The entire app hangs off one decision point on load:

1. **Necesito Ayuda (Need Help)** → short guided form → creates a posting
2. **Quiero Ayudar (Give Help)** → list/map of postings → go help
3. **Donar $ (Donate)** → static page of verified official organizations

## Flow 1: Need Help

A short, guided, step-by-step form (not a long single page — one question at a time reads as faster and less overwhelming under stress). Proposed fields, to confirm:

- **Category:** Supplies, Volunteer / physical presence, or Temporary housing
- **What do you need?** Short free-text description (with placeholder examples per category to guide people)
- **Location:** pin on the Manizales map (reuses the Leaflet + OpenStreetMap + Nominatim component already built) or type an address
- **Urgency:** Now / Today / This week
- **Contact (optional):** phone or WhatsApp — poster decides whether to include it
- **Photo (optional):** helps people understand the situation at a glance

On submit, two things happen:
1. The post goes live immediately on the Give Help map/list.
2. **A shareable image is generated** (see below) for the poster to download and post to their own Instagram/WhatsApp story — this is treated as a core feature, not an add-on, since the site alone won't reach enough people.

## Flow 2: Give Help

A list and a map (toggle or side-by-side) of all open postings, filterable by category and urgency. Someone picks a posting, sees the full details and location, and goes. If the poster included a phone/WhatsApp, it's shown directly — no extra opt-in step, since that friction doesn't add safety here, it just slows down a time-critical connection.

## Flow 3: Donate

A static list/grid of verified organizations actively accepting donations for this earthquake, in **both Spanish and English**. Based on current reporting, this includes Cruz Roja Colombiana, World Central Kitchen, Convoy of Hope, and the GlobalGiving Colombia Earthquake Relief Fund — to be confirmed/expanded closer to build time. The app never touches money directly; this page just routes people to the real thing.

## Key Feature: Auto-Generated Share Image

When a "Need Help" post is created, the app generates a downloadable image (PNG) formatted for social sharing:

- Vertical format (1080×1920) for IG/WhatsApp Stories, ideally also a square (1080×1080) version for feed posts
- Contains: category, the need description, general location (city/neighborhood — not exact address, for privacy/safety), urgency, and a short call to action
- Includes a QR code and/or short link back to the live posting or the Give Help page
- Generated client-side (e.g. `html-to-image` or Canvas) so it's instant and needs no backend service

This turns every single posting into outbound awareness material, which matters as much as the matching itself.

## What We're Deliberately Leaving Out

- **No accounts, no phone verification, no login** — the friction cost is worse than the risk it would reduce, given the situation.
- **No ratings/feedback system** — removed per your call; trust is social here, not score-based.
- **No missing-persons/pets feature** — other established platforms already cover this.
- **No in-app money handling** — donations route out to verified orgs instead.
- **No multi-city support yet** — Manizales only, this is a test phase.

## Minimal Safety Net (to confirm — see questions below)

Even without accounts, a couple of nearly-zero-friction safeguards are worth considering:
- A **"Report" button** on every posting, feeding a simple admin view (no account needed to report, just a flag)
- Basic spam/bot prevention on submission (rate limiting or a lightweight check) so the board doesn't get flooded
- A **private "manage my post" link** given to the poster right after submission (and saved in their browser) so they can mark it resolved or take it down later — without needing to log in

## Recommended Tech Stack

- **Frontend:** React
- **Data:** Firebase Firestore, open read/write with lightweight abuse protection (e.g. App Check + basic rate limiting) — no Firebase Auth/login required, this just gives everyone shared, real-time data
- **Map:** Leaflet + OpenStreetMap + Nominatim, bounded to Manizales (already built)
- **Image generation:** client-side, e.g. `html-to-image` or Canvas API
- **Language:** Spanish-first, with the Donate page bilingual (ES/EN)

## Decisions Locked

1. **Need Help form fields** confirmed as-is: category, description, location, urgency, optional contact. (Optional photo was cut during Firebase setup — see below.)
2. **Minimal safety net confirmed**: Report button + private manage-link, both zero-login.
3. **Share image branding**: leave a placeholder for now (empty logo slot, neutral palette). Pixel-art assets may be added later if time allows — build so swapping in a logo/palette later is a one-file change, not a rewrite.
4. **Give Help default view**: both list and map shown together. Mobile-first is essential — most users will be on phones, so this needs to work well on small screens (map/list stacked or tab-switchable, large tap targets, no heavy UI framework to keep load fast on unreliable connections).

## Amendment: Project Named

Final name: **Afán Sí Tengo**. Not yet done: a credit line to Camilo Cifuentes (e.g. "Inspirado en 'Yo afán no tengo' de Camilo Cifuentes") — Pali wants to hold off on adding this for now, revisit later. Also worth a quick check before wider launch: one search result referenced "fuerte controversia" associated with Cifuentes at some point; hasn't been investigated further, worth a look given the name ties the project to his public persona.

## Amendment: Photo Upload Cut

Firebase Storage (needed for the optional post photo) requires the project to be on the paid "Blaze" plan as of late 2024 — Pali chose not to add a billing method for a nice-to-have feature, so the photo step is removed from the Need Help form for now. Everything else is unaffected. Can be added back later if that trade-off becomes worth it.

## Build & Learning Approach

Pali has no prior Firebase experience. From this point forward, work proceeds **component by component**: each piece (Firebase/data layer, the map, the form, the share-image generator, etc.) gets explained — what it is, why it's needed, how it fits with the rest — before or alongside building/wiring it, rather than delivering a finished bundle all at once. The goal is that Pali understands and can maintain every part of this, not just receives a working app.

The frontend (React components for Landing, Need Help, Give Help, Donate, the map, the share-image generator) is already built and passed a build check. What's still needed to make it actually functional is the Firebase backend — that's the current component: understanding what Firebase is, setting up a project, and connecting it. Subsequent changes or new features should follow the same one-piece-at-a-time, explain-then-build pattern.

---

*Building component by component, with explanations at each step.*
