const { chromium } = require('playwright');
const fs = require('node:fs');

(async () => {
  fs.mkdirSync('artifacts', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  await page.addInitScript(() => {
    localStorage.setItem('peach-theme', 'luthier');
  });
  await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const state = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    lensDisplay: getComputedStyle(document.querySelector('.dial-lens')).display,
    needleDisplay: getComputedStyle(document.querySelector('.luthier-needle')).display,
    dialHeight: document.querySelector('.dial').getBoundingClientRect().height,
    libraryBottom: document.querySelector('.library-card').getBoundingClientRect().bottom,
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  if (state.theme !== 'luthier') throw new Error(`Expected luthier theme, got ${state.theme}`);
  if (state.lensDisplay !== 'none') throw new Error(`Luthier lens should be hidden, got ${state.lensDisplay}`);
  if (state.needleDisplay === 'none') throw new Error('Luthier needle should be visible');
  if (state.bodyWidth > state.viewportWidth + 1) throw new Error(`Horizontal overflow: ${state.bodyWidth}px > ${state.viewportWidth}px`);
  if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(' | ')}`);

  await page.screenshot({ path: 'artifacts/luthier-mobile-390x844.png', fullPage: true });

  await page.evaluate(() => {
    localStorage.setItem('peach-theme', 'console');
    location.reload();
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'artifacts/console-mobile-390x844.png', fullPage: true });

  console.log(JSON.stringify(state));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
