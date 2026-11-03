/** Quick onboarding used by later flows. */
export async function onboard(page, name = 'Ravi') {
  await page.waitForText('Hi, I’m Katori');
  await page.type('Your first name', name);
  await page.click('Continue');
  await page.waitForText('Nice to meet you');
  await page.type('Age', '30');
  await page.click('Male');
  await page.click('Continue');
  await page.waitForText('Your height and weight');
  await page.type('Height in centimetres', '172');
  await page.type('Weight', '78');
  await page.click('Continue');
  await page.waitForText('How active is a normal week?');
  await page.click('Lightly active');
  await page.click('Continue');
  await page.waitForText('What matters most right now?');
  await page.click('Lose weight');
  await page.click('Continue');
  await page.waitForText('Have a recent blood report?');
  await page.click('Skip for now');
  await page.waitForText('here’s your plan');
  await page.click('Start my day');
  await page.waitForText(`, ${name}`);
}
