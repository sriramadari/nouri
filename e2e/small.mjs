import { launch } from './cdp.mjs';
import { onboard } from './onboard.mjs';

const S = process.env.E2E_WORK ?? new URL('./.work', import.meta.url).pathname;
const BASE = process.env.APP_URL ?? 'http://localhost:8081';
const page = await launch({
  port: 9339,
  profileDir: `${S}/e2e-profile-small`,
  width: 500,
  height: 900,
});
const step = (msg) => console.log('✓', msg);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.send('Emulation.setDeviceMetricsOverride', {
  width: 320,
  height: 640,
  deviceScaleFactor: 2,
  mobile: true,
});
const overflow = () =>
  page.evaluate(
    `Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth`,
  );
try {
  await page.goto(BASE + '/');
  await page.waitForText('Eat well, know why.');
  await page.screenshot(`${S}/small-onboarding.png`);
  step(`onboarding at 320 px: horizontal overflow ${await overflow()} px`);
  await onboard(page, 'Sam');
  await page.waitForText('Start a streak');
  await sleep(1200);
  await page.screenshot(`${S}/small-today.png`);
  step(`Today at 320 px: horizontal overflow ${await overflow()} px`);
  await page.click('Type it in');
  await page.waitForText('Check your meal');
  await page.type('Food', 'Idli sambar');
  await page.type('Calories', '320');
  await page.type('Protein (optional)', '10');
  await page.click('Add food');
  await sleep(500);
  await page.screenshot(`${S}/small-sheet.png`);
  step(`meal sheet at 320 px: overflow ${await overflow()} px`);
  await page.click('Save meal · 320 kcal');
  await page.waitForText('Meal saved');
  await page.click('Health');
  await page.waitForText('Your lab results, explained');
  await page.screenshot(`${S}/small-health.png`);
  step(`Health at 320 px: overflow ${await overflow()} px`);
} catch (error) {
  console.error('✗', error.message.slice(0, 600));
  await page.screenshot(`${S}/e2e-failure.png`);
  process.exitCode = 1;
} finally {
  page.close();
}
