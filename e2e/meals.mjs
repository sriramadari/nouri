import { launch } from './cdp.mjs';
import { onboard } from './onboard.mjs';

const S = process.env.E2E_WORK ?? new URL('./.work', import.meta.url).pathname;
const BASE = process.env.APP_URL ?? 'http://localhost:8081';
const API = process.env.API_URL ?? 'http://localhost:3000';
const page = await launch({
  port: 9335,
  profileDir: `${S}/e2e-profile-meals`,
  width: 500,
  height: 1000,
  args: [
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    ...(process.env.VOICE_WAV
      ? [`--use-file-for-fake-audio-capture=${process.env.VOICE_WAV}`]
      : []),
  ],
});
const step = (msg) => console.log('✓', msg);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const serverMeals = async () => {
  const deviceId = await page.evaluate(`localStorage.getItem('katori.deviceId')`);
  const now = new Date();
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return (
    await (
      await fetch(`${API}/meals?date=${d}&tzOffsetMinutes=${-now.getTimezoneOffset()}`, {
        headers: { 'x-device-id': deviceId },
      })
    ).json()
  ).meals;
};
let chooserFile = null;
page.on(async (msg) => {
  if (msg.method === 'Page.fileChooserOpened' && chooserFile) {
    await page.send('DOM.setFileInputFiles', {
      files: [chooserFile],
      backendNodeId: msg.params.backendNodeId,
    });
  }
});
await page.send('Page.setInterceptFileChooserDialog', { enabled: true });

let t = Date.now();
try {
  await page.goto(BASE + '/');
  await onboard(page);
  await page.waitForText('Nothing logged yet');
  step('day one: empty meal list with a nudge');

  if (!process.env.SKIP_PHOTO && process.env.MEAL_PHOTO) {
    // --- Photo ---
    chooserFile = process.env.MEAL_PHOTO;
    t = Date.now();
    await page.click('Log a meal'); // the centre tab button
    await page.click('From gallery');
    await page.waitForText('Katori is looking at your plate', 15000);
    step('analyzing state with skeleton chips');
    await page.waitForText('Check your meal', 120000);
    const photoText = await page.text();
    step(
      `photo analysed in ${Math.round((Date.now() - t) / 1000)} s: ${photoText.match(/Save meal · \d+ kcal/)[0]}`,
    );
    await page.screenshot(`${S}/e2e-meal-review.png`);
    const before = Number(photoText.match(/Save meal · (\d+) kcal/)[1]);
    const firstChip = await page.evaluate(
      `[...document.querySelectorAll('[aria-label^="Remove "]')][0].getAttribute('aria-label').replace('Remove ', '')`,
    );
    await page.click(`Remove ${firstChip}`);
    await sleep(600);
    const afterRemove = Number((await page.text()).match(/Save meal · (\d+) kcal/)[1]);
    if (!(afterRemove < before)) throw new Error('Removing a chip did not lower the total');
    step(`removed "${firstChip}": total ${before} → ${afterRemove} kcal`);
    const secondChip = await page.evaluate(
      `[...document.querySelectorAll('[aria-label^="Remove "]')][0].getAttribute('aria-label').replace('Remove ', '')`,
    );
    await page.click(secondChip); // selects the chip and opens its editor
    await sleep(300);
    await page.click(`Bigger portion of ${secondChip}`);
    await sleep(600);
    const afterBigger = Number((await page.text()).match(/Save meal · (\d+) kcal/)[1]);
    if (!(afterBigger > afterRemove)) throw new Error('Bigger portion did not raise the total');
    step(`bigger portion of "${secondChip}": ${afterRemove} → ${afterBigger} kcal`);
    await page.screenshot(`${S}/e2e-meal-edit.png`);
    await page.click(`Save meal · ${afterBigger} kcal`);
    await page.waitForText('Meal saved');
    step('saved with a confirmation toast');
    await sleep(800);
    if ((await serverMeals()).length !== 1) throw new Error('Server should have 1 meal');
    step('server has the photo meal');
  }

  if (!process.env.SKIP_VOICE && process.env.VOICE_WAV) {
    // --- Voice (Chrome plays the WAV file as the microphone) ---
    await page.click('Log a meal'); // the centre tab button
    await page.click('Speak');
    await page.waitForText('Listening…');
    step('recording sheet with timer');
    await sleep(5500);
    await page.screenshot(`${S}/e2e-recording.png`);
    t = Date.now();
    await page.click('Done');
    await page.waitForText('Check your meal', 120000);
    const heard = (await page.text()).match(/Heard: “([^”]*)”/);
    step(`voice analysed in ${Math.round((Date.now() - t) / 1000)} s, heard: "${heard?.[1]}"`);
    const voiceKcal = (await page.text()).match(/Save meal · (\d+) kcal/)[1];
    await page.click(`Save meal · ${voiceKcal} kcal`);
    await page.waitForText('Meal saved');
  }

  // --- Offline: add by hand, sync later ---
  await page.send('Network.enable');
  await page.send('Network.emulateNetworkConditions', {
    offline: true,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  await page.click('Log a meal'); // the centre tab button
  await page.click('Type it in');
  await page.type('Food', 'Masala chai');
  await page.type('Calories', '90');
  await page.type('Protein (optional)', '3');
  await page.click('Add food');
  await page.click('Save meal · 90 kcal');
  await page.waitForText('Saved on your phone');
  step('offline save keeps the meal on the phone');
  await page.waitForText('Waiting to sync');
  step('meal shows "Waiting to sync" and counts towards today');
  await page.screenshot(`${S}/e2e-offline.png`);
  await page.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  for (let i = 0; i < 40 && (await page.text()).includes('Waiting to sync'); i++) await sleep(500);
  if ((await page.text()).includes('Waiting to sync')) throw new Error('Offline meal never synced');
  step('back online: the queued meal synced automatically');

  // --- Double tap on Save ---
  await page.click('Log a meal'); // the centre tab button
  await page.click('Type it in');
  await page.type('Food', 'Banana');
  await page.type('Calories', '105');
  await page.click('Add food');
  const rect = await page.evaluate(
    `(() => { const el = [...document.querySelectorAll('[aria-label="Save meal · 105 kcal"]')].at(-1); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`,
  );
  for (let i = 0; i < 2; i++)
    for (const type of ['mousePressed', 'mouseReleased'])
      await page.send('Input.dispatchMouseEvent', {
        type,
        x: rect.x,
        y: rect.y,
        button: 'left',
        clickCount: 1,
      });
  await page.waitForText('Meal saved');
  await sleep(1500);
  const meals = await serverMeals();
  const bananas = meals.filter((m) => m.items.some((i) => i.name === 'Banana')).length;
  if (bananas !== 1) throw new Error(`Double tap saved ${bananas} bananas`);
  step(`double tap on Save stored exactly one meal (server now has ${meals.length} meals)`);
  await page.screenshot(`${S}/e2e-today-meals.png`);
} catch (error) {
  console.error('✗', error.message.slice(0, 900));
  await page.screenshot(`${S}/e2e-failure.png`);
  process.exitCode = 1;
} finally {
  page.close();
}
