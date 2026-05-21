const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  // Set demo auth
  await page.goto('http://localhost:3737/');
  await page.evaluate(() => localStorage.setItem('atlas_authed', '1'));

  // Navigate to dashboard
  await page.goto('http://localhost:3737/dashboard');
  await page.waitForFunction(() => document.querySelectorAll('button').length > 5, { timeout: 20000 });

  // Open Plantas viewer + Humanizar tab
  await page.click('button:has-text("🏗️ Plantas")');
  await page.waitForTimeout(1500);
  await page.click('button:has-text("Humanizar")');
  await page.waitForTimeout(1000);

  // Create test image
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNkYPhfz0AEYBxVSF+FABJADveax1LaAAAAAElFTkSuQmCC';
  const testImagePath = '/tmp/test-floor-plan.png';
  fs.writeFileSync(testImagePath, Buffer.from(pngBase64, 'base64'));

  // Upload to humanizer
  const allInputs = await page.$$('input[type="file"]');
  await allInputs[allInputs.length - 1].setInputFiles(testImagePath);
  await page.waitForTimeout(1500);
  console.log('01 Image uploaded');

  // Trigger analysis
  await page.click('button:has-text("Gerar Análise")', { force: true });
  console.log('02 Analysis triggered');

  // Wait for analysis to show (tabs appear, loading stops)
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/shot-final-01-analysis-start.png' });

  // Check each tab
  const tabs = ['Análise', 'Render IA', 'Paleta', 'Marketing', 'Assistente'];
  for (const tabName of tabs) {
    const tab = await page.$(`button:has-text("${tabName}")`);
    if (tab) {
      await tab.click({ force: true });
      await page.waitForTimeout(1500);
      const slug = tabName.toLowerCase().replace(/[^a-z]/g, '').replace('ise', 'ise').replace('ia', '');
      await page.screenshot({ path: `/tmp/shot-final-02-${tabName.replace(/[^a-zA-Z]/g, '')}.png` });
      console.log(`03 Tab "${tabName}" screenshotted`);
    } else {
      console.log(`Tab "${tabName}" not found`);
    }
  }

  // Go back to Análise tab and check for scrollbar
  await page.click('button:has-text("Análise")', { force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/shot-final-03-analise-scroll.png' });

  // Check for scroll area
  const scrollArea = await page.$eval('[style*="overflowY"]', el => ({
    overflow: el.style.overflowY,
    height: el.offsetHeight,
    scrollHeight: el.scrollHeight
  })).catch(() => null);
  console.log('Scroll area:', scrollArea);

  await browser.close();
  console.log('DONE — screenshots saved');
})().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
