import { launch } from './cdp.mjs';
import { onboard } from './onboard.mjs';

const S = process.env.E2E_WORK ?? new URL('./.work', import.meta.url).pathname;
const BASE = process.env.APP_URL ?? 'http://localhost:8081';
const page = await launch({
  port: 9338,
  profileDir: `${S}/e2e-profile-health`,
  width: 500,
  height: 1100,
});
const step = (msg) => console.log('✓', msg);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
page.on(async (msg) => {
  if (msg.method === 'Page.fileChooserOpened') {
    await page.send('DOM.setFileInputFiles', {
      files: [new URL('./samples/lab-report.pdf', import.meta.url).pathname],
      backendNodeId: msg.params.backendNodeId,
    });
  }
});
await page.send('Page.setInterceptFileChooserDialog', { enabled: true });
try {
  await page.goto(BASE + '/');
  await onboard(page, 'Neha');
  const before = (await page.text())
    .match(/Your focus\n([\s\S]*?)\n(Open UI|Today)/)[1]
    .replace(/\n/g, ' | ');
  step(`Today focus before the report: ${before}`);

  await page.click('Health');
  await page.waitForText('Your lab results, explained');
  step('empty state with Camera and PDF options');
  await page.screenshot(`${S}/e2e-health-empty.png`);

  const started = Date.now();
  await page.click('PDF or photo');
  await page.waitForText('Reading your report', 10000);
  step('reading state with skeleton rows');
  await page.waitForText('results need attention', 150000);
  const summary = (await page.text()).match(/\d+ of \d+ results need attention/)[0];
  step(`report read in ${Math.round((Date.now() - started) / 1000)} s: ${summary}`);
  await sleep(500);
  await page.screenshot(`${S}/e2e-health-list.png`);

  const rows = await page.evaluate(
    `[...document.querySelectorAll('[aria-label$="Open details"]')].map((el) => el.getAttribute('aria-label').replace('. Open details', ''))`,
  );
  step(`list (flagged first): ${rows.slice(0, 4).join(' · ')} …`);
  const ldlRow = rows.find((r) => r.startsWith('LDL'));
  await page.click(`${ldlRow}. Open details`);
  await page.waitForText('WHY IT MATTERS');
  const sheet = await page.text();
  if (!sheet.includes('ONE THING TO TRY') || !sheet.includes('Healthy range: below 100'))
    throw new Error('LDL sheet incomplete');
  step('LDL detail sheet: range bar, why it matters, one thing to try');
  await page.screenshot(`${S}/e2e-health-sheet.png`);
  await page.click('Close');
  await sleep(500);

  const tshRow = rows.find((r) => r.startsWith('TSH'));
  if (tshRow) {
    await page.click(`${tshRow}. Open details`);
    await page.waitForText('compared this result with the range printed by your lab');
    step('unknown marker (TSH) judged by the lab’s own range, said honestly');
    await page.click('Close');
    await sleep(500);
  }

  await page.click('Today');
  await sleep(1000);
  const after = (await page.text())
    .match(/Your focus\n([\s\S]*?)\n(Open UI|Today)/)[1]
    .replace(/\n/g, ' | ');
  if (after === before) throw new Error('Focus areas did not change');
  step(`Today focus after the report: ${after}`);
} catch (error) {
  console.error('✗', error.message.slice(0, 900));
  await page.screenshot(`${S}/e2e-failure.png`);
  process.exitCode = 1;
} finally {
  page.close();
}
