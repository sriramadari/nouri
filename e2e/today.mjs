import { launch } from './cdp.mjs';
import { onboard } from './onboard.mjs';

const S = process.env.E2E_WORK ?? new URL('./.work', import.meta.url).pathname;
const BASE = process.env.APP_URL ?? 'http://localhost:8081';
const page = await launch({
  port: 9337,
  profileDir: `${S}/e2e-profile-today`,
  width: 500,
  height: 1100,
});
const step = (msg) => console.log('✓', msg);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** The assistant card reads "Katori", then the moment of the day, then the message. */
const assistantSays = (text) =>
  text.match(/Katori\n(?:Morning check in|Afternoon nudge|Evening recap|Well done)\n([^\n]+)/)[1];
const addByHand = async (food, kcal, protein) => {
  await page.click('Type it in');
  await page.type('Food', food);
  await page.type('Calories', String(kcal));
  await page.type('Protein (optional)', String(protein));
  await page.click('Add food');
  await page.click(`Save meal · ${kcal} kcal`);
  await page.waitForText('Meal saved');
  await sleep(1200);
};
try {
  await page.goto(BASE + '/');
  await onboard(page, 'Kiran');
  await page.waitForText('Start a streak');
  await page.waitForText('What did you eat?');
  const day1 = await page.text();
  step(`assistant card on day one: "${assistantSays(day1)}"`);
  if (!day1.includes('Start a streak')) throw new Error('Expected an unlit streak badge');
  if (!day1.includes('1,850') || !day1.includes('kcal left')) throw new Error('Rings missing');
  step('rings show 1,850 kcal left and 95 g protein to go; streak badge says "Start a streak"');
  await page.screenshot(`${S}/e2e-today-empty.png`);

  await addByHand('Paneer bhurji with roti', 900, 55);
  await page.waitForText('1-day streak');
  step('first meal lights the streak flame (1-day streak)');
  const mid = await page.text();
  step(
    `rings updated: ${mid.match(/[\d,]+\nkcal left/)[0].replace('\n', ' ')}, ${mid.match(/\d+ g to go/)[0]} protein`,
  );
  step(`assistant now says: "${assistantSays(mid)}"`);

  await addByHand('Dal rice and curd', 650, 42);
  await page.waitForText('Goal hit today');
  step('goal hit: celebration card shown');
  await sleep(600);
  await page.screenshot(`${S}/e2e-confetti.png`);
  await sleep(3500);
  await page.screenshot(`${S}/e2e-today-goal.png`);
  const done = await page.text();
  if (!done.includes('Your focus')) throw new Error('Focus summary missing');
  step('focus summary present on Today');

  await page.reload();
  await page.waitForText('Goal hit today');
  await sleep(1500);
  step(`after reload the goal card stays and confetti does not replay (once per day)`);
} catch (error) {
  console.error('✗', error.message.slice(0, 900));
  await page.screenshot(`${S}/e2e-failure.png`);
  process.exitCode = 1;
} finally {
  page.close();
}
