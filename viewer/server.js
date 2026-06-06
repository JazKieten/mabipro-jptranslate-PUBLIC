const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIALOG_FILE = path.join(__dirname, '..', 'npc.japan.txt');
const HTML_FILE = path.join(__dirname, 'index.html');

// SSE clients waiting for reload signals
let sseClients = [];

// Use watchFile (polling) instead of watch — fs.watch is unreliable on Windows for files
// in parent directories. Polls every 500 ms, only fires when mtime actually changes.
let watchTimeout = null;
fs.watchFile(DIALOG_FILE, { persistent: true, interval: 500 }, (curr, prev) => {
  if (curr.mtimeMs === prev.mtimeMs) return;
  clearTimeout(watchTimeout);
  watchTimeout = setTimeout(() => {
    console.log('[mabi-viewer] npc.japan.txt changed — notifying clients...');
    sseClients.forEach(res => { try { res.write('data: reload\n\n'); } catch (_) {} });
    sseClients = sseClients.filter(res => !res.destroyed);
  }, 200);
});

const server = http.createServer((req, res) => {
  // SSE endpoint for live reload
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(': connected\n\n');
    sseClients.push(res);
    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
    });
    return;
  }

  // POST /save — write edited lines back to npc.japan.txt
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { changes } = JSON.parse(body);
        let content = fs.readFileSync(DIALOG_FILE, 'utf8');
        const hasBOM = content.charCodeAt(0) === 0xFEFF;
        if (hasBOM) content = content.slice(1);
        const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
        const lines = content.split(/\r?\n/);
        changes.forEach(({ lineNumber, rawLine }) => {
          if (lineNumber >= 1 && lineNumber <= lines.length) {
            lines[lineNumber - 1] = rawLine;
          }
        });
        fs.writeFileSync(DIALOG_FILE, (hasBOM ? '﻿' : '') + lines.join(lineEnding), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        console.error('[mabi-viewer] Save error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // Serve dialog.txt as plain text
  if (req.url.startsWith('/dialog.txt')) {
    fs.readFile(DIALOG_FILE, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // Serve static files from the viewer directory (images, etc.)
  const safePath = path.normalize(req.url.split('?')[0]);
  const filePath = path.join(__dirname, safePath);
  if (safePath !== '/' && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Serve index.html for everything else
  fs.readFile(HTML_FILE, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Could not load index.html');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n🍀 Mabi Dialog Viewer running at http://localhost:${PORT}`);
  console.log(`   Watching npc.japan.txt — browser auto-refreshes on save!\n`);
});
