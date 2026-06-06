const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIALOG_FILE = path.join(__dirname, '..', 'npc.japan.txt');
const HTML_FILE = path.join(__dirname, 'index.html');

// SSE clients waiting for reload signals
let sseClients = [];

// Watch the source file for changes — debounced so rapid multi-fire on Windows sends only one reload
let watchTimeout = null;
fs.watch(DIALOG_FILE, () => {
  clearTimeout(watchTimeout);
  watchTimeout = setTimeout(() => {
    console.log('[mabi-viewer] npc.japan.txt changed — notifying clients...');
    sseClients.forEach(res => res.write('data: reload\n\n'));
    sseClients = sseClients.filter(res => !res.destroyed);
  }, 150);
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
