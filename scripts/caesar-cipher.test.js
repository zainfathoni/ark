const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

test('Caesar helper supports character-by-character solving without revealing the message', async t => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '../viz/caesar-cipher.html')).href);
    const output = () => page.locator('#decoded').textContent();
    const choose = letter => page.locator(`[data-plain="${letter}"]`).click();

    await t.test('keeps unsolved and repeated letters hidden; checks only the selected character', async () => {
      assert.equal(await page.locator('#message').inputValue(), 'NXHOV FNCRP\nNUXNA FNAQV');
      assert.equal(await output(), '····· ·····\n····· ·····');
      assert.equal(await page.locator('#key').inputValue(), '13');
      await choose('B');
      assert.match(await page.locator('#feedback').textContent(), /Not yet/);
      assert.equal(await output(), '····· ·····\n····· ·····');
      await page.locator('[data-index="2"]').click();
      await choose('U');
      assert.equal(await output(), '··U·· ·····\n····· ·····');
      assert.equal(await page.locator('[data-index="0"]').getAttribute('aria-pressed'), 'true');
      await choose('A');
      assert.equal(await output(), 'A·U·· ·····\n····· ·····');
      assert.equal(await page.locator('[data-index="12"] small').textContent(), '·');
      assert.equal(await page.locator('#progress').textContent(), '2 of 20 letters solved');
      await page.locator('#restart').click();
      assert.equal(await output(), '····· ·····\n····· ·····');
    });

    await t.test('loads all museum problems and preserves their grouping and padding', async () => {
      const problems = [
        { key: '13', encrypted: 'NXHOV FNCRP\nNUXNA FNAQV', plain: 'AKUBI SAPEC\nAHKAN SANDI' },
        { key: '17', encrypted: 'UFBKV IIFVS\nZFEFB VIKFG RKZZZ', plain: 'DOKTE RROEB\nIONOK ERTOP ATIII' },
        { key: '18', encrypted: 'SBSCL WESFE\nMCWEM KWMEK SFVAP', plain: 'AJAKT EMANM\nUKEMU SEUMS ANDIX' }
      ];
      for (const [index, problem] of problems.entries()) {
        await page.locator(`[data-example="${index}"]`).click();
        assert.equal(await page.locator('#message').inputValue(), problem.encrypted);
        assert.equal(await page.locator('#key').inputValue(), problem.key);
        assert.equal(await output(), problem.encrypted.replace(/[A-Za-z]/g, '·'));
        assert.equal(await page.locator(`[data-example="${index}"]`).getAttribute('aria-pressed'), 'true');
        for (const letter of problem.plain.replace(/[^A-Z]/g, '')) await choose(letter);
        assert.equal(await output(), problem.plain);
        assert.match(await page.locator('#prompt').textContent(), /All letters solved/);
        assert.equal(await page.locator('.pair:disabled').count(), 26);
      }
    });

    await t.test('handles wraparound, lowercase, unchanged characters, and resets', async () => {
      await page.locator('#message').fill('Abz!\n é🙂 9');
      await page.locator('#key').selectOption('1');
      assert.equal(await output(), '···!\n é🙂 9');
      assert.equal(await page.locator('.pair.highlight').getAttribute('aria-label'), 'A becomes Z');
      await choose('Z');
      await choose('A');
      await choose('Y');
      assert.equal(await output(), 'Zay!\n é🙂 9');
      await page.locator('#key').selectOption('25');
      assert.equal(await output(), '···!\n é🙂 9');
      await choose('B');
      await choose('C');
      await choose('A');
      assert.equal(await output(), 'Bca!\n é🙂 9');
      await page.locator('#key').selectOption('0');
      await choose('A');
      await choose('B');
      await choose('Z');
      assert.equal(await output(), 'Abz!\n é🙂 9');
      await page.locator('#message').fill('');
      assert.equal(await output(), 'Your work will appear here.');
      assert.equal(await page.locator('.pair:disabled').count(), 26);
      await page.locator('#message').fill('🙂 123!');
      assert.equal(await output(), '🙂 123!');
      assert.equal(await page.locator('#characters button').count(), 0);
    });

    await t.test('supports keyboard solving and narrow layouts', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('[data-example="2"]').click();
      await page.locator('[data-index="4"]').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('[data-index="4"]').getAttribute('aria-pressed'), 'true');
      await page.locator('[data-plain="T"]').focus();
      await page.keyboard.press('Enter');
      assert.equal(await output(), '····T ·····\n····· ····· ·····');
      assert.equal(await page.locator('[data-index="0"]').evaluate(el => el === document.activeElement), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.locator('#message').fill('<img src=x onerror=alert(1)>');
      assert.equal(await page.locator('#characters img, #decoded img').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
