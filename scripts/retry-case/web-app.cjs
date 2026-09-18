// Original synthetic app for a browser-visible retry experiment.
const http = require('node:http');
const path = require('node:path');

function createApp(subjectPath) {
  const ledger = Object.create(null);
  const attempts = [];
  let rejectB = true;
  let busy = false;
  let status = 'Ready';
  const state = () => ({ status, attempts: [...attempts], receipts: Object.keys(ledger), busy });
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.url === '/state' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(state()));
    }
    if (req.url === '/deliver' && req.method === 'POST') {
      if (busy) { res.writeHead(409); return res.end('Busy'); }
      busy = true;
      try {
        const resolved = require.resolve(subjectPath);
        delete require.cache[resolved];
        const { deliver } = require(resolved);
        const result = await deliver([{ id: 'A' }, { id: 'B' }], ledger, async item => {
          attempts.push(item.id);
          if (item.id === 'B' && rejectB) { rejectB = false; return { status: 'rejected' }; }
          return { status: 'accepted', receipt: 'receipt-' + item.id };
        });
        status = result.status === 'complete' ? 'Complete' : 'B failed. Retry the batch.';
      } catch { status = 'Needs review'; }
      finally { busy = false; }
      res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(state()));
    }
    if (req.url !== '/' || req.method !== 'GET') { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Retry lab | QuorumPatch</title>
<style>body{font:18px system-ui;background:#101217;color:#edf0f7;margin:0;padding:8vw}main{max-width:720px;margin:auto}h1{font-size:clamp(32px,6vw,56px)}button{font:inherit;padding:14px 24px;background:#edf0f7;color:#101217;border:0;border-radius:8px;cursor:pointer}button:focus-visible{outline:3px solid #82b4ff;outline-offset:4px}button:disabled{opacity:.6}output{display:block;font-size:24px;padding:24px 0}small{color:#b9c2d4}#attempts{letter-spacing:.1em}</style>
<main><small>QuorumPatch / synthetic retry lab</small><h1>Send once.<br>Retry what failed.</h1><p>Two operations. B rejects its first attempt.</p><button id="deliver">Send batch</button><output id="status" aria-live="polite">Ready</output><p>Send order: <strong id="attempts">None</strong></p><p>Saved receipts: <span id="receipts">None</span></p></main>
<script>const button=document.getElementById('deliver');function render(s){document.getElementById('status').textContent=s.status;document.getElementById('attempts').textContent=s.attempts.join(' → ')||'None';document.getElementById('receipts').textContent=s.receipts.join(', ')||'None';button.textContent=s.attempts.length?'Retry batch':'Send batch';button.disabled=s.busy||s.status==='Complete'}button.onclick=async()=>{button.disabled=true;try{const r=await fetch('/deliver',{method:'POST'});if(!r.ok)throw Error();render(await r.json())}catch{document.getElementById('status').textContent='Connection failed. Reload to inspect state.'}};fetch('/state').then(r=>r.json()).then(render).catch(()=>{document.getElementById('status').textContent='Unable to load state.';button.disabled=true})</script></html>`);
  });
  return { server, state };
}
module.exports = { createApp };
if (require.main === module) {
  const { server } = createApp(path.resolve(__dirname, 'subject.cjs'));
  server.listen(Number(process.env.PORT || 3000), '0.0.0.0');
}
