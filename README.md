# Folio · The Night Library

A 3D library that runs from dusk till dawn. The whole interface follows the hour: warm plaster at
golden hour, blue hour, lamplit midnight, then a rose dawn. It starts at your real local time
(daytime visitors arrive at 21:40, the library's favourite hour).

- **The Shelf** — a curved row of 24 books on a turning platter (WebGL). Spines face you; the centre
  book turns to show its cover. Drag the shelf, click a spine, use ← →, or scrub the **night dial**
  (18:00–06:00): it turns the platter to the book best read at that hour and changes the light.
- **The reading table** — the book lies on linen under window light. It opens, and you drag its pages
  (they curl with a little gravity). Each spread is a different hour of the same night: a four-layer
  paper-cut landscape that moves with your cursor, and the hour, chapter and text. Reading through the
  book moves the library's clock with you. Chapter list, dot pager, “Thank you for reading slowly”.
- **Authors** — arched niches, lit while the writer is awake; each opens a portrait with letters (daily
  stories), books and a forthcoming release.
- **Rooms** — a facade of reading-room windows that glow with activity; join a room, ask Lumen to
  catch you up, post a message.
- **Lanterns** — the leaderboard as lanterns rising by score. **Desk** — your books, streak candles, wax seals.
- **Lumen** — the night librarian (✦ Ask Lumen) suggests a book and turns the shelf to it.

Design references: Scrolltide's *Sable* (archive shelf on a platter, timeline scrubber, release page
with a ghost number), *The Long Light* (book on sunlit linen, page curl, a different hour per spread,
paper-cut parallax) and *Solano* (plaster arches, serif wordmark with sun, room tab bar).

## Run it

```bash
npm install
npm run dev       # http://localhost:5171
npm run build     # production build in dist/
```

Requires Node 20+. Without WebGL the screens still work over a flat background.

## Structure

```
src/
  main.js          state, routing (#/, #/book/<id>, #/authors, #/author/<id>, #/rooms/<id>, #/lanterns, #/desk), interactions, camera
  views.js         HTML for every screen and the shared chrome (clock, tab bar, Lumen)
  night.js         the hour → sky, wall, light and interface colours
  library.js       the 24-book catalogue (hours, chapters, landscapes), hall, Lumen answers
  data.js          authors, readers, rooms, original books
  covers.js        cover and spine painting (CSS + canvas)
  scene/stage.js   renderer, arched-window room shader, lights
  scene/shelf.js   the turning shelf
  scene/reader.js  the reading table and page curl
  scene/pages.js   page artwork: paper-cut landscapes, hours, cover
  styles.css       the design language (colours are CSS variables set by night.js)
```

## Changing things

- Add a book: one row in `MORE` in `library.js` and its id in `ORDER` (the order is the night's order).
- Change the light at any hour: the `KEYS` table in `night.js`.
- A book's landscape: `scene` = `city`, `sea`, `orchard`, `road`, `sky` or `valley`.
