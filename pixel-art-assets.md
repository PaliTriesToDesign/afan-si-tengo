# Pixel Art Assets — Icon List & Micro-interactions

8 icons total. Placeholder-first: build these as flat, single-color-friendly sprites so swapping the palette later (per project decision) stays a one-file change.

Base canvas: **32×32px**, exported at **4x (128×128)** for crisp display on retina screens. Keep to a **4–6 color palette** (indexed mode in Aseprite) so PNGs stay tiny — this matters given the unreliable-connection constraint.

## Color palette (pulled from `src/styles.css`)

This isn't a placeholder — it's the site's real dark theme, already live. Use these exact hex values in Aseprite so the sprites drop in without any color correction.

| Role | Hex | CSS variable | Use in sprites |
|---|---|---|---|
| Background | `#1c1a24` | `--color-bg` | Canvas/transparent-equivalent base, dark fills |
| Surface | `#26212f` | `--color-surface` | Card-level background if an icon needs a backing shape |
| White / text | `#f4efe6` | `--color-text` | Off-white, not pure `#fff` — main line/fill color for idle icons |
| Muted text | `#b7b1c4` | `--color-text-muted` | Secondary lines, inactive/disabled state |
| Border | `#3a3448` | `--color-border` | Outlines, inactive category icon strokes |
| Primary / active accent | `#f4efe6` | `--color-primary` | Selected-state glow or fill (same as white) |

**Per-icon accent colors** (the app's three action colors — muted version for resting/map-pin use, neon for landing-page hover/press):

| Icon | Muted (resting) | Neon (hover/press/active) |
|---|---|---|
| Necesito Ayuda | `#c1440e` | `#ff5a36` |
| Quiero Ayudar | `#2f6f4f` (text: `#74c79a`) | `#2ee6a6` |
| Donar | `#b8860b` | `#ffc93c` |

**Urgency colors** (for reference if urgency ever gets its own icon/pin tint, not just the current badge): now `#d64526`, today `#c98a1b`, week `#3f7a52`.

Supplies / Voluntariado / Alojamiento (the 3 category icons) have **no dedicated brand color today** — they currently render as emoji on the neutral surface/border palette. Draw them in `#f4efe6` (white) on transparent, same as the nav icons, so they stay consistent with the rest of the UI until/unless category-specific colors get added.

## Landing nav (3)

| Icon | Idle | Micro-interaction | Frames |
|---|---|---|---|
| Necesito Ayuda — raised hand | static | On tap: fingers flex/close briefly, then a soft pulse ring expands outward once (urgency cue, not a distress animation) | 3–4 |
| Quiero Ayudar — two hands | static | On hover/tap: hands close the gap and clasp | 3 |
| Donar — heart | static | On tap: quick "thump" scale-up (heartbeat), settles back | 2–3 |

## Categories (3) — reused across form, list, map pins, share image

| Icon | Idle | Micro-interaction | Frames |
|---|---|---|---|
| Suministros — box | closed | On select: lid flips open | 3 |
| Voluntariado — person | static | On select: small wave (arm up-down) | 3 |
| Alojamiento — house | static | On select: window "lights up" (single pixel color swap) | 2 |

## Shared actions (2)

| Icon | Idle | Micro-interaction | Frames |
|---|---|---|---|
| Location pin | static | Drop-in bounce when placed on map (pin falls, squashes, settles) | 4 |
| Contacto — phone | static | Subtle shake/ring wiggle on hover (signals "tap to call") | 3 |

## Aseprite production notes

- **Tags per sprite:** name each animation state as a Tag (`idle`, `hover`, `active`) inside one `.aseprite` file per icon — keeps states organized and lets you export per-tag sprite sheets.
- **Keep loops short:** 2–4 frames per interaction, ~100–150ms per frame. These are accents, not showpieces — the app needs to stay light on slow connections.
- **Export as sprite sheet (PNG) + JSON**, not GIF — GIFs re-encode color loss and are heavier. A CSS `steps()` animation or a simple JS frame-swap over the sprite sheet is enough; no video/canvas library needed.
- **Onion skinning on** while animating so movement stays consistent across all 8 icons — same "weight" of motion (e.g., same bounce height for pin drop and box lid).
- **Palette file:** save one `.gpl`/`.png` palette swatch now (even if placeholder neutral colors) and reference it in every sprite — this is what makes the future palette swap a one-file change instead of touching all 8 icons individually.
- **Idle state should also exist as a static PNG fallback** (frame 0 of each animation) for anywhere the interaction isn't wired up yet, or for the share-image generator, which needs a flat, non-animated version.

Skipped from custom pixel art: urgency levels (Now/Today/This week) — better as a color-coded badge, not an icon. Report and manage-post link — minor UI actions, don't need bespoke sprites.
