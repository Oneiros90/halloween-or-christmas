# Halloween or Christmas

A full-screen kiosk page that flips its entire look (background, foreground, and music) according to the calendar. Halloween gets the whole of October, because of course it does: it is Spooktober. At midnight on the first of November it becomes Christmas, and it stays that way until the sixth of January. That is Epiphany, traditionally the last day of the season; in Italian we even say *L'Epifania tutte le feste porta via* (Epiphany carries all the feasts away). The rest of the year it shows a default scene.

The idea comes from this meme: the same room, one minute apart, two completely different holidays.

![11:59 Halloween, 12:00 Christmas](assets/readme/meme.jpg)

The page exists to make that joke literal. Leave it open on a TV and the switch happens by itself, with no UI and no reload.

Live site: [https://oneiros90.github.io/halloween-or-christmas/](https://oneiros90.github.io/halloween-or-christmas/)

## What it does

The screen has four layers, from back to front:

1. A black fill, so empty areas never flash white.
2. A **background** that covers the viewport (image or muted looping video).
3. A **foreground** that sits on top, contained in the viewport (image or muted looping video, including transparent PNGs).
4. A **clock** in the bottom-right corner: a large `hh:mm:ss` on the first line, and the date underneath as day, month name, and year (for example `25 October 2026`). The month name follows the device language. A light black shadow keeps it readable on any scene.

The only sound is a looping music track for the current season. Background and foreground videos are always muted, even if the file has an audio track.

Which season you get depends on the device's local time:

| Window | Theme | Folder |
| --- | --- | --- |
| 1 October 00:00 (inclusive) → 1 November 00:00 (exclusive) | Halloween | `assets/halloween` |
| 1 November 00:00 (inclusive) → 6 January 00:00 (exclusive) | Christmas | `assets/christmas` |
| Everything else | Default | `assets/default` |

Each folder may contain up to three files, named by slot: `background.*`, `foreground.*`, `music.*`. Images, videos, and audio are chosen by extension. A missing slot is simply skipped: no placeholder, no error chrome. Two files for the same slot fail the build.

The page is meant to run unattended on a TV:

- No zoom, no scroll, no text selection.
- Viewport scaling is locked.
- Assets for every season are preloaded up front, so the midnight change is a swap of opacity and playback, not a new download.
- The clock is visible immediately. Media appear as soon as that season's files are ready.

### Debug clock

Scroll the mouse wheel (or the Magic Remote wheel) over a clock field (hours, minutes, seconds, day, month, or year) to nudge that unit. Time keeps running from the new instant, so you can walk the calendar and watch the seasons change. Refreshing the page restores the real system clock. The offset is memory-only.

## How it works

### Source and output

The source is **Svelte 4** and **TypeScript**, built with **Vite 5**. Svelte 4 is used on purpose: Svelte 5's runtime needs a newer Chromium than many TV browsers ship.

The production output is a single `dist/index.html` with CSS and JavaScript inlined as a classic (non-module) ES2015 script, plus the `assets` folder next to it. Videos and audio are not embedded in the HTML. Relative URLs (`base: './'`) make the page work both locally and on a GitHub Pages project site.

`vite-plugin-singlefile` inlines the bundle. A small Vite plugin then strips `type="module"`, moves the script to the end of `<body>`, and copies `assets/` into `dist/assets`.

### Asset manifest

GitHub Pages does not list directories, so the app cannot discover files at runtime. `scripts/write-manifest.mjs` runs before `dev` and `build`, scans `assets/{halloween,christmas,default}`, and writes `src/generated/manifest.ts`. Each file gets a content hash on the URL (`?v=…`) so a replaced video is not stuck in a TV cache.

### Clock and seasons

A `requestAnimationFrame` loop reads `Date.now() + offset`. `themeFor()` maps that virtual date onto one of the three seasons. The debug wheel changes `offset` by adding calendar units (seconds wrap into minutes, months clamp the day so 31 January minus one month stays in December).

The current season is shown as soon as its files are ready. If you skip ahead to a season that is still loading, the previous one stays on screen until the new one can appear.

### Media

Images are warmed with `Image()`. Video and audio use normal HTTP URLs on `<video>` / `<audio>` (with a typed `<source>`), because webOS TV does not play `blob:` media. Hidden seasons stay in the DOM at opacity 0. Cover and contain are computed in JavaScript from `videoWidth` / `naturalWidth` and the viewport size, without `object-fit`, so older WebViews still layout correctly.

Videos are `muted`, `volume = 0`, `playsinline`, and restarted on `ended` because some TVs ignore the `loop` attribute. Music autoplays; if the browser blocks it, the first click, tap, or key starts it. Changing season stops and rewinds the previous track before starting the new one.

Fonts are self-hosted in `assets/fonts` (Big Shoulders Display for the time, Cormorant Garamond for the date), with `woff2` and `woff` for older engines.

### Deploy

Pushing `main` runs `.github/workflows/pages.yml`: `npm ci`, `npm run build`, upload `dist`, deploy with GitHub Pages. The published site is the single HTML file plus `assets`.

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Drop replacement media into `assets/halloween`, `assets/christmas`, or `assets/default` using the slot names above, then rebuild. The manifest scanner picks them up automatically.
