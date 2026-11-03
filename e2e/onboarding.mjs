import { launch } from './cdp.mjs';

const S = process.env.E2E_WORK ?? new URL('./.work', import.meta.url).pathname;
const BASE = process.env.APP_URL ?? 'http://localhost:8081';
const page = await launch({ profileDir: `${S}/e2e-profile`, width: 500, height: 900 });
const step = (msg) => console.log('✓', msg);
try {
  await page.goto(BASE + '/');
  await page.waitForText('Eat well, know why.');
  step('new user lands on the welcome screen');
  // The welcome screen animates in; wait for it to settle before tapping.
  await new Promise((r) => setTimeout(r, 1200));
  await page.click('Let’s begin');
  await page.waitForText('First, what should I call you?');
  step('one tap opens the first question');

  await page.click('Continue');
  await page.waitForText('What should Katori call you?');
  step('empty name shows a friendly error');
  await page.type('Your first name', 'Asha');
  await page.click('Continue');

  await page.waitForText('Nice to meet you, Asha');
  step('name carried into the next card');
  await page.type('Age', '12');
  await page.click('Continue');
  await page.waitForText('Katori is built for adults 16 and up.');
  step('age under 16 rejected');
  await page.waitForText('Please choose one.');
  step('missing sex flagged');
  await page.type('Age', '28');
  await page.click('Female');
  await page.click('Continue');

  await page.waitForText('Your height and weight');
  await page.type('Height in centimetres', '160');
  await page.type('Weight', '68');
  await page.click('Continue');

  await page.waitForText('How active is a normal week?');
  step('reached activity step');
  await page.click('Back');
  await page.waitForText('Your height and weight');
  const valueOf = (label) =>
    page.evaluate(`document.querySelector('input[aria-label="${label}"]')?.value`);
  const [height, weight] = [await valueOf('Height in centimetres'), await valueOf('Weight')];
  if (height !== '160' || weight !== '68')
    throw new Error(`Back lost answers: ${height}, ${weight}`);
  step(`back navigation keeps answers (height ${height}, weight ${weight})`);
  await page.click('ft / in');
  const [feet, inches] = [await valueOf('Feet'), await valueOf('Inches')];
  if (feet !== '5' || inches !== '3') throw new Error(`Unit toggle gave ${feet} ft ${inches} in`);
  step(`unit toggle converts 160 cm → ${feet} ft ${inches} in`);
  await page.click('Continue');

  await page.click('Continue');
  await page.waitForText('Pick the one closest to a normal week.');
  step('activity required');
  await page.click('Lightly active');
  await page.click('Continue');
  await page.waitForText('What matters most right now?');
  await page.click('Lose weight');
  await page.click('Continue');

  await page.waitForText('Have a recent blood report?');
  step('optional report step shown');
  await page.screenshot(`${S}/e2e-report-step.png`);
  await page.click('Skip for now');

  await page.waitForText('Asha, this is your daily katori');
  step('plan shown');
  // Focus areas animate in one after another.
  await new Promise((r) => setTimeout(r, 1500));
  const plan = await page.text();
  for (const expected of ['1,400', '80', 'Focus on these', 'Walk 10 minutes after meals']) {
    if (!plan.includes(expected)) throw new Error(`Plan missing "${expected}"`);
  }
  step('plan shows 1,400 kcal, 80 g protein and focus areas');
  await page.screenshot(`${S}/e2e-plan.png`);

  await page.click('Start my day');
  await page.waitForText(', Asha');
  step('lands on Today');

  await page.reload();
  await page.waitForText(', Asha');
  if ((await page.text()).includes('Eat well, know why.'))
    throw new Error('Onboarding shown again after reload');
  step('after a reload (app restart) Today opens directly with the profile');
  await page.screenshot(`${S}/e2e-today.png`);

  const deviceId = await page.evaluate(`localStorage.getItem('katori.deviceId')`);
  const me = await (
    await fetch(`${process.env.API_URL ?? 'http://localhost:3000'}/users/me`, {
      headers: { 'x-device-id': deviceId },
    })
  ).json();
  if (me.profile?.name !== 'Asha' || me.targets?.calories !== 1400)
    throw new Error('Server profile: ' + JSON.stringify(me));
  step(
    `server has the profile: ${me.profile.name}, ${me.targets.calories} kcal, ${me.targets.proteinG} g (device ${deviceId.slice(0, 8)}…)`,
  );
} catch (error) {
  console.error('✗', error.message);
  await page.screenshot(`${S}/e2e-failure.png`);
  process.exitCode = 1;
} finally {
  page.close();
}
