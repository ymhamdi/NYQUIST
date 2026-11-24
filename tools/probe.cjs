// usage: node probe.cjs <base> <shotdir> <route>...
const puppeteer = require('puppeteer-core');
const [base, shots, ...routes] = process.argv.slice(2);
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  for (const r of routes) {
    const errors = [];
    page.removeAllListeners('pageerror'); page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + r, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(res => setTimeout(res, 1500));
    const m = await page.evaluate(() => {
      const vw = window.innerWidth; const over = [];
      for (const el of document.querySelectorAll('body *')) {
        const b = el.getBoundingClientRect();
        if (b.width > 0 && b.right > vw + 1 && getComputedStyle(el).position !== 'fixed') {
          // only report outermost offenders
          if (!over.some(o => o.el.contains(el))) over.push({ el, tag: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0,2).join('.') : ''), right: Math.round(b.right) });
        }
      }
      // smallest tap targets among buttons/links/inputs
      const small = [...document.querySelectorAll('button,a,input,select,[role=tab]')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.height < 24 || b.width < 24); }).length;
      return { vw, scrollW: document.documentElement.scrollWidth, overflow: over.slice(0, 4).map(o => o.tag + '→' + o.right), small, plots: document.querySelectorAll('.js-plotly-plot').length, h: document.documentElement.scrollHeight };
    });
    const name = (r.replace(/[#/]/g, '_') || 'home');
    await page.screenshot({ path: `${shots}/${name}.png`, fullPage: false });
    console.log(r.padEnd(28), JSON.stringify(m), errors.length ? 'ERR:' + errors[0] : '');
  }
  // offline test: visit a TP page online first (warm cache), then go offline and reload
  await page.goto(base + '#/automatique/tp3', { waitUntil: 'networkidle0' });
  await page.setOfflineMode(true);
  let offline;
  try { await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 }); await new Promise(r => setTimeout(r, 2000));
        offline = await page.evaluate(() => ({ text: document.body.innerText.slice(0, 120).replace(/\s+/g,' '), len: document.body.innerText.length, sw: !!navigator.serviceWorker && !!navigator.serviceWorker.controller })); }
  catch (e) { offline = { error: e.message.slice(0, 120) }; }
  console.log('OFFLINE reload:', JSON.stringify(offline));
  await page.screenshot({ path: `${shots}/offline.png` });
  await browser.close();
})();
