import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url    = process.argv[2] || 'http://localhost:5007';
const label  = process.argv[3] || '';

// Auto-increment screenshot filename
const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const existing = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const outPath  = path.join(dir, filename);

const browser = await puppeteer.launch({
  headless: true,
  executablePath: (
    fs.existsSync('C:/Users/nateh/.cache/puppeteer/chrome/win64-131.0.6778.87/chrome-win64/chrome.exe')
      ? 'C:/Users/nateh/.cache/puppeteer/chrome/win64-131.0.6778.87/chrome-win64/chrome.exe'
      : undefined
  ),
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

// Force all reveal elements visible instantly (bypass Intersection Observer delay)
await page.evaluate(() => {
  // Remove transition delays so everything appears at once
  const style = document.createElement('style');
  style.textContent = `
    .rv, .rvl, .rvr {
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
    }
  `;
  document.head.appendChild(style);
  document.querySelectorAll('.rv,.rvl,.rvr').forEach(el => el.classList.add('on'));
});
await new Promise(r => setTimeout(r, 600));

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outPath}`);
