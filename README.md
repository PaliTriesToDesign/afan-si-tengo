# Afán Sí Tengo

A zero-login web app connecting people who need help with people who want to
give help, built in response to the August 10, 2026 earthquake. No accounts,
no ratings, no money handled in-app — see `/project-brief-manizales-mutual-aid.md`
(one folder up) for the full design rationale.

Three things on load: **Necesito Ayuda**, **Quiero Ayudar**, **Donar $**.

## Quick Start (local)

```bash
npm install
cp .env.example .env   # then fill in your Firebase config, see below
npm run dev
```

## 1. Create a Firebase project (free tier)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Once created, click the **web** icon (`</>`) to register a web app — this gives you the config values for `.env`.
3. In the left sidebar, enable **Firestore Database** → Create database → start in production mode (the rules file below locks it down correctly).
4. Copy the six config values shown into your local `.env` file (see `.env.example`). No Firebase Auth setup needed — this app doesn't use login.

**About Storage:** this project intentionally does _not_ use Firebase Storage (the optional post-photo feature was cut). As of late 2024, enabling Storage requires the whole Firebase project to be on the pay-as-you-go **Blaze** plan — usage would still be free at this app's scale, but it does mean adding a billing method, which isn't worth it for a "maybe later" feature. `storage.rules` is still in this repo, unused, ready for if you decide to add photos back later (you'd re-enable Storage, restore `uploadPostPhoto` in `src/lib/firebase.js`, and re-add the photo `<input>` in `NeedHelp.jsx` — all three were straightforward before being removed, check git history or ask for it back).

## 2. Deploy the security rules

`firestore.rules` implements the app's trust model: anyone can post and browse without an account, but posts can't be edited or deleted after creation (only marked resolved), and no one can post as someone else. Read the comment block at the top of the file for the specific trade-offs.

```bash
npm install -g firebase-tools   # if you don't have it
firebase login
firebase init firestore   # point it at the existing firestore.rules file, don't overwrite it
firebase deploy --only firestore:rules
```

**About indexes:** the "Give Help" list runs a query that filters by `status` *and* sorts by `createdAt` — Firestore can't serve that from its automatic single-field indexes, it needs a composite index you create once. This repo's `firestore.indexes.json` defines it, so deploy it the same way as the rules:

```bash
firebase deploy --only firestore:indexes
```

(If you ever see a Firestore error in the browser console mentioning "requires an index" with a console.firebase.google.com link, that link does the same thing — it pre-fills and creates the missing index for you in the dashboard, one click. Either path works; the file just means it's version-controlled and doesn't need to be redone if you ever recreate the project.)

## 3. Run it

```bash
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

## 4. Deploy (Firebase Hosting is the fastest free path)

```bash
firebase init hosting   # public directory: dist, single-page app: yes
npm run build
firebase deploy --only hosting
```

Once it's live on a real domain (not `localhost` or a local file), address search will work correctly — Nominatim (the free geocoding service this app uses) requires a valid Referer header, which only a real URL provides.

## How data flows (no accounts, by design)

- **Posting a need** writes a document to the `posts` collection in Firestore, tagged with a random `editToken` that only the poster receives (via a "manage link" shown after posting, and saved to their own browser).
- **Browsing** subscribes to all posts with `status: "open"` in real time — no page refresh needed to see new posts.
- **Reporting** writes to a separate `reports` collection for manual review in the Firebase console (Firestore tab) — there's no admin UI yet, this is intentionally minimal for the initial launch.
- **Resolving a post** happens via the manage link (`/gestionar?post=...&token=...`), which only changes the `status` field per the Firestore rules.

None of this requires a login. The trade-off, and why it's an intentional one, is documented in `firestore.rules`.

## Adding another city later

Everything city-specific lives in `src/lib/constants.js` under `CITIES`. Add an entry with the same shape (label, center, zoom, viewbox) and it'll be picked up by the map defaults and the geocoding bounds automatically — the dropdown is already wired to render every entry in `CITIES`, it's just showing one option (Manizales) for now.

## Adding branding later

`src/styles.css` has a `:root` block of CSS variables (`--color-need`, `--color-give`, etc.) driving every color in the app, plus two empty placeholder slots ready for a logo/pixel-art asset:

- `.brand-placeholder` on the landing page
- `.share-card-logo-placeholder` on the auto-generated share image

Swap those two blocks and the palette variables, and the branding pass is done — no component logic needs to change.

## Known limitations (intentional, for a fast launch)

- **Moderation is manual.** Reports land in the `reports` Firestore collection with no admin dashboard yet — check the Firebase console directly.
- **The manage-link "security" is soft.** Anyone who reads a post's raw data (not shown in the UI, but technically fetchable) could see its `editToken`. This is a deliberate simplicity trade-off matching the app's low-friction philosophy, not an oversight — see the comment block at the top of `firestore.rules`.
- **Nominatim rate limits.** Free geocoding caps at 1 request/second and asks callers to cache — this app does cache implicitly (a post's coordinates are stored once and never re-geocoded), but very high simultaneous form submissions could hit the limit. Fine for the current scale; worth revisiting if usage grows a lot.
