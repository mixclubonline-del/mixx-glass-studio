const { chromium } = require('playwright');

(async () => {
  const url = process.env.SMOKE_URL || 'http://localhost:8080';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    const ok = await page.waitForFunction(() => {
      return !!(window && window.__WASM_INITIALIZED__);
    }, { timeout: 20000 }).catch(() => null);

    if (ok) {
      console.log('SMOKE: WASM initialized');
      await browser.close();
      process.exit(0);
    } else {
      console.error('SMOKE: WASM did not initialize in time');
      await browser.close();
      process.exit(2);
    }
  } catch (err) {
    console.error('SMOKE: Error', err);
    await browser.close();
    process.exit(3);
  }
})();
