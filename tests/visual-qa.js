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

  await page.addInitScript(() => localStorage.setItem('peach-theme', 'luthier'));
  await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const state = await page.evaluate(() => {
    const style = (selector, pseudo = null) => getComputedStyle(document.querySelector(selector), pseudo);
    const needle = document.querySelector('.luthier-needle');
    const target = document.querySelector('.chromatic-tick[data-note-index="0"] .chromatic-tick__label');
    const needleRect = needle.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const spearTop = Number.parseFloat(style('.luthier-needle', '::before').top) || 0;
    return {
      theme: document.documentElement.dataset.theme,
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      dialBeforeContent: style('.dial', '::before').content,
      readoutOrnament: style('.dial-note-readout', '::before').backgroundImage,
      dividerOrnament: style('.tuning-workspace-nav', '::after').backgroundImage,
      finialOrnament: style('.library-card', '::after').backgroundImage,
      crownOrnament: style('.dial-bezel-light').backgroundImage,
      lensDisplay: style('.dial-lens').display,
      needleDisplay: style('.luthier-needle').display,
      needleTipY: needleRect.top + spearTop,
      targetBottomY: targetRect.bottom,
    };
  });

  console.log(`TUNER ${JSON.stringify(state)}`);
  if (state.theme !== 'luthier') throw new Error(`Expected Luthier, got ${state.theme}`);
  if (state.bodyWidth > state.viewportWidth + 1) throw new Error(`Horizontal overflow: ${state.bodyWidth} > ${state.viewportWidth}`);
  if (state.dialBeforeContent !== 'none') throw new Error(`Redundant dial frame remains: ${state.dialBeforeContent}`);
  if (!state.readoutOrnament.includes('luthier-readout-flower.svg')) throw new Error('Readout floral ornament missing');
  if (!state.dividerOrnament.includes('luthier-divider.svg')) throw new Error('Workspace divider ornament missing');
  if (!state.finialOrnament.includes('luthier-finial.svg')) throw new Error('Library finial ornament missing');
  if (!state.crownOrnament.includes('luthier-binding-crown.svg')) throw new Error('Binding crown ornament missing');
  if (state.lensDisplay !== 'none') throw new Error('Console loupe must stay hidden in Luthier');
  if (state.needleDisplay === 'none') throw new Error('Luthier needle must be visible');
  if (state.needleTipY < state.targetBottomY - 1) throw new Error(`Needle obscures target note: ${state.needleTipY} < ${state.targetBottomY}`);
  if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(' | ')}`);

  await page.screenshot({ path: 'artifacts/luthier-tuner-390x844.png', fullPage: true });

  await page.evaluate(() => document.querySelector('#tuning-scroll').scrollTo({ left: 0, behavior: 'instant' }));
  await page.waitForTimeout(350);
  const library = await page.evaluate(() => {
    const card = document.querySelector('#tuning-card-library').getBoundingClientRect();
    const activeFilter = getComputedStyle(document.querySelector('.library-filter.is-active'));
    return {
      left: card.left,
      right: card.right,
      viewportWidth: window.innerWidth,
      activeFilterColor: activeFilter.color,
      activeFilterBackground: activeFilter.backgroundImage,
    };
  });
  console.log(`LIBRARY ${JSON.stringify(library)}`);
  if (library.right <= 0 || library.left >= library.viewportWidth) throw new Error('Library card is not visible');
  await page.screenshot({ path: 'artifacts/luthier-library-390x844.png', fullPage: true });

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
