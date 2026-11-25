# Folio 01 · The Night Library

Immersive 3D — the library as a set of rooms you walk through.

Live: https://folio-night-library.vercel.app

This is one of three independent Folio projects, each in its own repository with its own
dependencies, configuration and deployment. Nothing is shared, so you can change it freely.

## Run it

```bash
npm install
npm run dev       # http://localhost:5171
npm run build     # production build in dist/
npm run preview   # serve the build locally
```

Requires Node 20 or newer.

## Where things live

| File | What to edit there |
| --- | --- |
| `index.html` | Screen markup, inside `<template id="app-template">`. |
| `src/data.js` | All sample content: books, authors, readers, rooms, copy. |
| `src/app.js` | Screen logic: navigation, state, every button handler, AI "thinking" states. |
| `src/styles.css` | Visual style, animations, responsive breakpoints, reduced-motion rules. |
| `src/runtime.js` | The tiny rendering engine (see below). You rarely need to touch it. |
| `vercel.json` | Deployment settings for this project only. |

## How the template works

- `{{name}}` or `{{book.title}}` is filled from the object `bindings()` returns in `src/app.js`.
- `<for-each list="{{items}}" as="item">…</for-each>` repeats its content for each item.
- `<show-if value="{{isOpen}}">…</show-if>` renders only when the value is truthy.
- On SVG elements use `data-svg-d="{{path}}"` / `data-svg-points="{{pts}}"` for bound geometry.
- `onClick="{{handler}}"` (also `onChange`, `onPointerDown`, …) calls a function from `bindings()`.
- Inside a handler, `this.setState({ ... })` updates state and re-renders. The DOM is patched in
  place, so animations keep running and inputs keep focus.

To add a screen: add a `view` value and an `is…` flag in `bindings()`, wrap the markup in
`<show-if value="{{is…}}">`, and navigate with the existing `go('…')` helper.

## Screens

| Screen | What it shows |
| --- | --- |
| Stacks | Discovery: a 3D book carousel you drag or swipe; mood filters; "Take it down" opens a book. |
| Book on the table | A 3D book that opens to its first lines; credits for every contributor; reading room link. |
| Portrait Gallery | Authors as framed portraits in a corridor you walk through. |
| Portrait | Author profile with stacked daily "letters", follow, forthcoming book. |
| Commons | Community: lit windows are reading rooms; Lumen AI digest; working replies. |
| Hall of Lanterns | Leaderboard as lanterns whose height is the score; reader profile cards. |
| Your desk | Reader profile: ribbon bookmarks for progress, streak candles, wax-seal achievements. |
| Lumen | AI reading companion (lamp button): prompt chips, thinking state, recommendation. |

## Deploy

The Vercel project `folio-night-library` points at this folder (the repository root).
Every push to `main` redeploys it; pull requests get preview URLs. To deploy by hand:

```bash
npx vercel --prod
```
