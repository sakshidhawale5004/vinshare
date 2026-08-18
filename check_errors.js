import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log('Navigating to https://vinshare.vercel.app/ ...');
  await page.goto('https://vinshare.vercel.app/', { waitUntil: 'networkidle2' });
  
  await browser.close();
})();
