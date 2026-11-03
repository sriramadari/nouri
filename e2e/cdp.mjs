// Minimal Chrome DevTools Protocol driver for smoke-testing the web build. Test-only, not shipped.
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ port = 9333, profileDir, width = 500, height = 900, args = [] }) {
  rmSync(profileDir, { recursive: true, force: true });
  const proc = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDir}`,
      `--window-size=${width},${height}`,
      ...args,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200);
    try {
      target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(
        (t) => t.type === 'page',
      );
    } catch {}
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else listeners.forEach((l) => l(msg));
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  await send('Page.enable');
  await send('Runtime.enable');
  const evaluate = async (expression) =>
    (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result
      .value;

  const page = {
    send,
    evaluate,
    on: (fn) => listeners.push(fn),
    goto: async (url) => {
      await send('Page.navigate', { url });
      await sleep(1500);
    },
    reload: async () => {
      await send('Page.reload', {});
      await sleep(1500);
    },
    text: () => evaluate('document.body.innerText'),
    waitForText: async (text, timeout = 30000) => {
      const end = Date.now() + timeout;
      while (Date.now() < end) {
        if ((await page.text()).includes(text)) return;
        await sleep(250);
      }
      throw new Error(
        `Timed out waiting for text: ${text}\n--- page ---\n${(await page.text()).slice(0, 800)}`,
      );
    },
    /** Clicks the innermost visible element whose text (or aria-label) matches exactly. */
    click: async (text) => {
      const rect = await evaluate(`(() => {
        const want = ${JSON.stringify(text)};
        const all = [...document.querySelectorAll('body *')].filter((el) => {
          const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false;
          return el.getAttribute('aria-label') === want || el.innerText?.trim() === want;
        });
        const el = all.at(-1); if (!el) return null;
        el.scrollIntoView({ block: 'center' });
        const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      })()`);
      if (!rect) throw new Error(`No element with text: ${text}`);
      for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', {
          type,
          x: rect.x,
          y: rect.y,
          button: 'left',
          clickCount: 1,
        });
      }
      await sleep(400);
    },
    /** Focuses the input with this accessibility label and types into it. */
    type: async (label, value) => {
      await evaluate(
        `(() => { const el = document.querySelector('input[aria-label=${JSON.stringify(label)}]'); el.focus(); el.select?.(); })()`,
      );
      await send('Input.insertText', { text: value });
      await sleep(250);
    },
    screenshot: async (path) => {
      mkdirSync(dirname(path), { recursive: true });
      const { data } = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
      });
      writeFileSync(path, Buffer.from(data, 'base64'));
    },
    close: () => {
      ws.close();
      proc.kill();
    },
  };
  return page;
}
