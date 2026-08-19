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

  const state = await page.evaluate(async () => {
    const needle = document.querySelector('.luthier-needle');
    const cLabel = document.querySelector('.chromatic-tick[data-note-index="0"] .chromatic-tick__label');
    const needleRect = needle.getBoundingClientRect();
    const labelRect = cLabel.getBoundingClientRect();
    const spearTop = Number.parseFloat(getComputedStyle(needle, '::before').top) || 0;
    const style = (selector) => getComputedStyle(document.querySelector(selector));

    const img = new Image();
    img.src = './textures/ebony-512.webp';
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const ebonyPixel = [...ctx.getImageData(20, 20, 1, 1).data];

    return {
      theme: document.documentElement.dataset.theme,
      lensDisplay: style('.dial-lens').display,
      needleDisplay: style('.luthier-needle').display,
      needleTipY: needleRect.top + spearTop,
      targetNoteBottomY: labelRect.bottom,
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      ebonyPixel,
      tuner: {
        background: style('.tuner-card').backgroundImage,
        backgroundColor: style('.tuner-card').backgroundColor,
        opacity: style('.tuner-card').opacity,
        filter: style('.tuner-card').filter,
      },
      nav: {
        background: style('.tuning-workspace-nav').backgroundImage,
        backgroundColor: style('.tuning-workspace-nav').backgroundColor,
        opacity: style('.tuning-workspace-nav').opacity,
        filter: style('.tuning-workspace-nav').filter,
      },
      readout: {
        background: style('.dial-note-readout').backgroundImage,
        backgroundColor: style('.dial-note-readout').backgroundColor,
        opacity: style('.dial-note-readout').opacity,
        filter: style('.dial-note-readout').filter,
      },
    };
  });

  console.log(`INITIAL ${JSON.stringify(state)}`);
  if (state.theme !== 'luthier') throw new Error(`Expected luthier theme, got ${state.theme}`);
  if (state.lensDisplay !== 'none') throw new Error(`Luthier lens should be hidden, got ${state.lensDisplay}`);
  if (state.needleDisplay === 'none') throw new Error('Luthier needle should be visible');
  if (state.needleTipY < state.targetNoteBottomY - 1) {
    throw new Error(`Needle overlaps target note: tip y=${state.needleTipY}, note bottom=${state.targetNoteBottomY}`);
  }
  if (state.bodyWidth > state.viewportWidth + 1) throw new Error(`Horizontal overflow: ${state.bodyWidth}px > ${state.viewportWidth}px`);
  if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(' | ')}`);

  await page.screenshot({ path: 'artifacts/luthier-mobile-390x844.png', fullPage: true });

  await page.evaluate(() => {
    const scroll = document.querySelector('#tuning-scroll');
    scroll.scrollTo({ left: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(350);
  const libraryState = await page.evaluate(() => ({
    cardLeft: document.querySelector('#tuning-card-library').getBoundingClientRect().left,
    cardRight: document.querySelector('#tuning-card-library').getBoundingClientRect().right,
    viewportWidth: window.innerWidth,
    scrollLeft: document.querySelector('#tuning-scroll').scrollLeft,
  }));
  console.log(`LIBRARY ${JSON.stringify(libraryState)}`);
  if (libraryState.cardRight <= 0 || libraryState.cardLeft >= libraryState.viewportWidth) {
    throw new Error('Library card did not become visible at the first carousel position');
  }
  await page.screenshot({ path: 'artifacts/luthier-library-mobile-390x844.png', fullPage: true });

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
