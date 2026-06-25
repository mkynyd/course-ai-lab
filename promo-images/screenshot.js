const { chromium } = require('/Users/yinjunhang/Documents/course-ai-lab/light-ai-chat/node_modules/playwright-core');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 3000, height: 3000, deviceScaleFactor: 1 }
  });

  const htmlPath = path.resolve(__dirname, 'promo.html');
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });

  // Wait longer for fonts to load
  await page.waitForTimeout(3000);

  const slides = [
    '01-brand', '02-project', '03-chat', '04-pdf',
    '05-agent', '06-paper', '07-exam', '08-socratic', '09-rag'
  ];

  for (let i = 0; i < slides.length; i++) {
    const slideId = `slide-${i + 1}`;
    const element = await page.locator(`#${slideId}`);
    await element.screenshot({
      path: path.resolve(__dirname, `${slides[i]}.png`),
      omitBackground: true
    });
    console.log(`Screenshot ${slides[i]}.png done`);
  }

  await browser.close();
})();
