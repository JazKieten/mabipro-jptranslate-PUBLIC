# mabipro-jptranslate-PUBLIC

A community-driven English translation project for the Mabinogi online game.

---

## MabiScript Studio (MSS)

A local browser-based editor for working with Mabinogi dialogue files (`.japan.txt` format).

### What it does

- **Browse & edit** tab-separated dialogue lines from `npc.japan.txt` directly in the game's dialog box UI
- **Live reload** — edits saved to the file are reflected in the viewer automatically
- **Search** by line number, line range (`86–90`), or keyword (exact substring, tags excluded)
- **Paginated results** — 100 results per page with Prev / Next navigation
- **Section filter** — filter results to specific NPC sections
- **Tag-aware editing** — non-display tags (`<keyword>`, `<button>`, etc.) are hidden during editing but preserved on save
- **`<p/>` segments** — each `<p/>` break creates a separate dialog box, matching the in-game rendering
- **Diff panel** — tracks all unsaved changes with a before/after view; click the unsaved count to open it
- **BOM-safe saves** — preserves UTF-8 BOM and original line endings

### Running MSS

Requires [Node.js](https://nodejs.org/).

```bash
cd viewer
node server.js
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

The server watches `npc.japan.txt` for changes and pushes a live reload to the browser automatically.

### File format

`npc.japan.txt` is tab-separated:

```
key<TAB>dialogue body
```

Example:
```
taillteann.npc_name.123	Hello, traveler! <br/> How can I help you?<p/>See you around.
```

- `<br/>` → line break (editable as a real newline in MSS)
- `<p/>` → paragraph break → separate dialog box in MSS
- All other tags are hidden during editing and restored on save

---

## Translation Guidelines

- **Demon → Fomor** (standardized term)
- Preserve all tags exactly — MSS handles this automatically
- UTF-8 with BOM required for game compatibility
