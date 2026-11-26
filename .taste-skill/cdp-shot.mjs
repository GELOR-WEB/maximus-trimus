// Small CDP screenshot helper for local UI review (project-local, not part of the kit).
// usage: node .taste-skill/cdp-shot.mjs <url> <w> <h> <out.png> [js-to-run-before-shot]
import fs from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';

const [url, W, H, out, scriptArg] = process.argv.slice(2);
const script = scriptArg?.startsWith('@')
  ? fs.readFileSync(scriptArg.slice(1), 'utf8')
  : scriptArg;
const width = +W || 1440;
const height = +H || 900;
const profile = 'C:\\Users\\Gelor\\Downloads\\Maximus-Trimus\\.taste-skill\\chrome-cdp';
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9333;

fs.mkdirSync(profile, { recursive: true });
const child = spawn(chrome, [
  '--headless=new',
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${port}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--hide-scrollbars',
  '--mute-audio',
  '--disable-gpu',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  `--window-size=${width},${height}`,
  'about:blank',
], { stdio: 'ignore', windowsHide: true });

const kill = () => {
  if (child.exitCode != null) return;
  try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); }
  catch { try { child.kill(); } catch {} }
};

try {
  let ver;
  for (let i = 0; i < 100; i++) {
    try {
      ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      break;
    } catch { await sleep(150); }
  }
  if (!ver) throw new Error('Chrome did not start');
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
  let id = 0;
  const pend = new Map();
  const subs = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    else subs.forEach((f) => f(m));
  });
  const send = (method, params = {}, sessionId) => new Promise((r) => {
    const i = ++id;
    pend.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = async (m, p) => {
    const r = await send(m, p, sessionId);
    if (r.error) throw new Error(`${m}: ${r.error.message}`);
    return r.result;
  };
  const ev = async (x) => (await S('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result.value;
  subs.push((m) => { if (m.method === 'Runtime.exceptionThrown') console.error('exception:', m.params.exceptionDetails.text); });
  await S('Page.enable');
  await S('Runtime.enable');
  await S('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await S('Page.navigate', { url });
  await sleep(2500);
  if (script) {
    const value = await ev(script);
    if (value !== undefined) console.log('eval:', JSON.stringify(value));
  }
  await sleep(1200);
  const clip = process.env.CLIP ? JSON.parse(process.env.CLIP) : undefined;
  const { data } = await S('Page.captureScreenshot', clip ? { format: 'png', clip: { ...clip, scale: 1 } } : { format: 'png' });
  fs.mkdirSync(out.split(/[\\/]/).slice(0, -1).join('/') || '.', { recursive: true });
  fs.writeFileSync(out, Buffer.from(data, 'base64'));
  console.log('saved', out);
} finally {
  kill();
}
