# Mabi Dialog Viewer

A local dev tool for previewing Mabinogi-style NPC dialog lines while you edit them in VSCode.

## Setup

No npm install needed — just plain Node.js.

```
node server.js
```

Then open **http://localhost:3000** in your browser.

## How it works

- Edit `dialog.txt` in VSCode (or any editor)
- The server watches the file and pushes a live-reload signal via SSE
- The browser re-fetches and re-renders instantly — no manual refresh needed

## dialog.txt format

One line per entry, **tab-separated**:

```
key<TAB>dialog text with <br/> and <p/> tags
```

Supported tags:
- `<br/>` — line break within a paragraph
- `<p/>` — paragraph spacer (taller gap)
- `<username/>` — replaced with the character name set in index.html (default: `Traveler`)

## Customizing your character name

In `index.html`, find this line near the top of the `<script>` block:

```js
const USERNAME = 'Traveler';
```

Change it to your character's name.

## NPC emoji map

Edit the `npcEmoji()` function in `index.html` to add portraits for your NPCs:

```js
const map = { Edern: '🔨', Sion: '⚙️', YourNPC: '🌸' };
```
