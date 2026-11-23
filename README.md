# Sticky Notes (dsh-sticky-notes)

A lightweight sticky-notes panel for DSH (DeepSeek Harness). It adds an entry to the left sidebar; opening it reveals a central panel where you can jot down ideas as colorful cards. Notes are saved automatically in the browser's local storage.

## Plugin Info

- **Package name**: `@oakzhong/dsh-sticky-notes`
- **Version**: `1.1.0`
- **Entry**: `index.js` (package / Host half) and `client.js` (Client half); the UI entry is the left sidebar item **Sticky notes**
- **Type**: DSH Cordis bundle, Client-side plugin (`dsh.client.platform: web`, `immediately: true`); the Host half is a no-op, all UI and logic live in the Client

## Tech Stack

| Layer | Technology |
|---|---|
| Plugin framework | DSH Cordis bundle (`cordis.patch.yml` inserts the Loader line) |
| Host half | ESM `export function apply() {}`, no backend routes |
| Client half | Frontend module registered via `window.__ModuleLoader__`; React without JSX (`React.createElement`) |
| UI styling | Injected `<style>` (`data-plugin-css` marker), uses DSH theme tokens, adapts to light/dark themes |
| Internationalization | `ctx.locale.register / bind`, zh / en bilingual |
| Storage | Browser `localStorage`, key `dsh-sticky-notes.notes.v1` |
| Graphics | CSS-drawn cards (folded corner simulated with a gradient), no image dependency |

## Features

### 1. Note management

- **Create** a note — a new card is added with an automatically assigned color.
- **Title + body** editing — two input areas, edited directly and auto-saved on every change.
- **Delete** a single note with a confirmation prompt.
- **6 colors** — switch a card's background in one click (yellow / pink / green / blue / orange / purple).

### 2. Browsing & display

- Cards are laid out in a responsive grid with generous sizing (minimum 260 × 230), leaving ample room for title and body.
- A card's footer shows **creation time / update time** on the same row.
- **Search** filters notes fuzzily by title or body.
- **Zoom** via `−` / percentage / `+` in the toolbar, ranging from 60% to 200%; clicking the percentage resets to 100%.

### 3. Data, themes & security

- All notes are persisted to `localStorage`, surviving refresh and restart.
- Reads are backward-compatible: missing titles are filled in, colors are validated, and timestamps are backfilled.
- zh / en bilingual, following the DSH language setting.
- Uses host theme tokens so text and backgrounds adapt to light and dark themes.
- Note text is rendered only as React elements and is never interpreted as HTML.

### Notes data structure

Each note is an object:

```js
{
  id: string,          // unique identifier
  heading: string,     // title
  text: string,        // body
  color: string,       // background color (one of COLORS)
  createdAt: number,   // creation timestamp
  updatedAt: number,   // last update timestamp
}
```

## Directory Structure

```
dsh-sticky-notes/
├── package.json        # manifest, bundle config, client injection declaration
├── cordis.patch.yml    # Loader insertion line
├── index.js            # Host half (no-op)
├── client.js           # Client half: UI, state, storage, styles
├── locale/
│   ├── zh.json         # Chinese display metadata
│   └── en.json         # English display metadata
├── icon.svg            # plugin icon
├── README.md           # English documentation
└── README.zh.md        # Chinese documentation
```

## Installation & Usage

1. Install the bundle through the Plugin Manager (`install_bundle` pointing to this directory).
2. Click **Sticky notes** in the left sidebar.
3. Click **New note** to start writing; the title and body can be edited at any time and are saved automatically.
4. Use the color buttons to distinguish notes, search to find them quickly, and zoom to adjust card size.
