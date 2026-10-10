// End-to-end acceptance check. Run: npm run build && npx vite preview --port 4173 & node e2e/smoke.mjs
// Needs Playwright (PLAYWRIGHT_MODULE can point to its index.mjs if not installed locally).
import fs from 'fs';
import path from 'path';
const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { chromium } = pw.default ?? pw;
const XLSX = await import('xlsx');

const URL = process.env.APP_URL || 'http://localhost:4173/';
const OUT = process.env.OUT_DIR || 'e2e/out';
fs.mkdirSync(OUT, { recursive: true });
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✅' : '❌'} ${msg}`);
  if (!cond) failures++;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, acceptDownloads: true, locale: 'he-IL' });
const page = await ctx.newPage();
page.on('pageerror', (e) => { console.log('PAGE ERROR', e.message); failures++; });
const shot = (n) => page.screenshot({ path: path.join(OUT, `${n}.png`) });
const fab = () => page.locator('button.fixed.end-5');
const sheet = () => page.locator('[role=dialog]');
const pause = (ms = 250) => page.waitForTimeout(ms);

await page.goto(URL);
await page.waitForSelector('text=Trip Wallet');
ok((await page.getAttribute('html', 'dir')) === 'rtl', 'Hebrew RTL by default');

// --- Onboarding
const today = new Date();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const start = new Date(today); start.setDate(start.getDate() - 9);
await page.locator('input[type=date]').first().fill(iso(start));
const names = ['Me', 'Dan', 'Noa', 'Yoni'];
for (let i = 0; i < 4; i++) await page.locator('input[aria-label^="מטיילים"]').nth(i).fill(names[i]);
await shot('01-onboarding');
await page.getByRole('button', { name: 'יצירת הטיול שלי' }).click();
await page.waitForSelector('nav');
await shot('02-home-empty');

// --- deterministic ARS rate via manual override
await page.goto(URL + '#/settings');
await page.getByLabel('ARS ידני').fill('260');
await page.getByLabel('ARS ידני').press('Enter');
await pause();

// --- Two-way conversion
await page.goto(URL + '#/home');
await fab().click();
await sheet().locator('select').first().selectOption('AR');
await sheet().getByRole('radio', { name: 'ARS' }).click();
const localIn = sheet().getByLabel(/ ARS$/);
const ilsIn = sheet().getByLabel(/ ILS$/);
await localIn.fill('10000');
ok((await ilsIn.inputValue()) === '38.46', `10,000 ARS fills ILS (got ${await ilsIn.inputValue()})`);
await ilsIn.fill('100');
ok((await localIn.inputValue()) === '26000', `₪100 fills ARS (got ${await localIn.inputValue()})`);
await sheet().getByLabel('שער').fill('250');
ok((await localIn.inputValue()) === '25000', `editing rate recalculates (got ${await localIn.inputValue()})`);
await sheet().getByRole('radio', { name: /אוכל ומסעדות/ }).click();
await sheet().getByRole('radio', { name: /מזומן/ }).click();
await shot('03-expense-form');
await sheet().getByRole('button', { name: /^שמירה( ·|$)/ }).click();
await pause(400);

// --- global rate change does not rewrite history
await page.goto(URL + '#/settings');
await page.getByLabel('ARS ידני').fill('300');
await page.getByLabel('ARS ידני').press('Enter');
await pause();
await page.goto(URL + '#/expenses');
await page.locator('text=אוכל ומסעדות').first().click();
ok((await sheet().getByLabel(/ ILS$/).inputValue()) === '100', 'old expense keeps ₪100 after global rate change');
ok((await sheet().getByLabel('שער').inputValue()) === '250', 'old expense keeps its own rate 250');
await sheet().getByLabel('סגירה').click();

// --- Spread: 5-night hostel ₪1000
await fab().click();
await sheet().locator('select').first().selectOption('AR');
await sheet().getByRole('radio', { name: '₪ ILS' }).click();
await sheet().getByLabel(/ ILS$/).fill('1000');
await sheet().getByRole('radio', { name: /לינה/ }).click();
await sheet().getByRole('radio', { name: /כרטיס/ }).click();
await sheet().getByRole('button', { name: /פרטים נוספים/ }).click();
await sheet().locator('input[type=number]').fill('5');
await sheet().getByRole('button', { name: /^שמירה( ·|$)/ }).click();
await pause(400);

// --- ₪300 dinner split equally between 4
await fab().click();
await sheet().getByRole('radio', { name: '₪ ILS' }).click();
await sheet().getByLabel(/ ILS$/).fill('300');
await sheet().getByRole('radio', { name: /אוכל ומסעדות/ }).click();
await sheet().getByRole('button', { name: 'הכול' }).click();
ok(await sheet().getByText('₪75 לכל אחד').isVisible(), 'split shows ₪75 each');
await sheet().getByRole('button', { name: /^שמירה( ·|$)/ }).click();
await pause(400);

// group view for stats
await page.goto(URL + '#/stats');
await page.getByRole('radio', { name: /סה"כ קבוצה/ }).click();
await page.getByRole('button', { name: 'יומי' }).click();
await pause(500);
await shot('04-stats-daily');
const dayText = await page.locator('section.card').nth(1).innerText();
ok(dayText.includes('₪200'), 'hostel spread shows ₪200 on a day');

// --- Settle up
await page.goto(URL + '#/wallet');
await page.getByRole('radio', { name: /חלוקה/ }).click();
await pause();
await shot('05-split');
const settleText = await page.locator('section.card').first().innerText();
const transfers = (settleText.match(/₪75/g) || []).length;
ok(transfers === 3, `settle-up shows 3 transfers of ₪75 (got ${transfers})`);

// --- Wallet ATM ₪500 -> 120,000 ARS
await page.getByRole('radio', { name: /ארנק/ }).click();
await page.getByRole('button', { name: /הוספת כסף/ }).first().click();
await sheet().locator('select').selectOption('AR');
await sheet().getByRole('button', { name: 'ARS', exact: true }).click();
await sheet().getByLabel('שילמתי ILS').fill('500');
await sheet().getByLabel('קיבלתי ARS').fill('120000');
ok((await sheet().innerText()).includes('1 ₪ = 240.0 ARS'), 'effective rate 240 shown');
await shot('06-money');
await sheet().getByRole('button', { name: 'שמירה' }).click();
await pause(400);
await shot('07-wallet');
const walletText = await page.locator('main').innerText();
ok(walletText.includes('95,000 ARS'), 'ARS cash = 120,000 − 25,000 = 95,000');

// --- Home
await page.goto(URL + '#/home');
await pause(300);
await shot('08-home');

// --- Export xlsx
await page.goto(URL + '#/settings');
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /ייצוא לאקסל/ }).click()]);
const xlsxPath = path.join(OUT, 'export.xlsx');
await dl.saveAs(xlsxPath);
const wb = XLSX.read(fs.readFileSync(xlsxPath));
ok(wb.SheetNames.length === 6, `xlsx has 6 sheets: ${wb.SheetNames.join(', ')}`);

// --- Backup -> wipe -> restore (with a photo)
await page.goto(URL + '#/expenses');
await page.locator('text=לינה').first().click();
if (!(await sheet().locator('input[type=file]').count())) await sheet().getByRole('button', { name: /פרטים נוספים/ }).click();
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR42mP8z8DwnwEJMDGgAQYGBgB9gwIBd8XbVAAAAABJRU5ErkJggg==', 'base64');
await sheet().locator('input[type=file]').setInputFiles({ name: 'r.png', mimeType: 'image/png', buffer: png });
await sheet().locator('img').waitFor();
await sheet().getByRole('button', { name: /^שמירה( ·|$)/ }).click();
await pause(400);
await page.goto(URL + '#/settings');
const [bk] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /גיבוי \(JSON\)/ }).click()]);
const bkPath = path.join(OUT, 'backup.json');
await bk.saveAs(bkPath);
const countBefore = await page.evaluate(() => new Promise((r) => { const q = indexedDB.open('trip-wallet'); q.onsuccess = () => { const c = q.result.transaction('expenses').objectStore('expenses').count(); c.onsuccess = () => r(c.result); }; }));
page.once('dialog', (d) => d.accept());
await page.getByRole('button', { name: 'מחיקת כל הנתונים' }).click();
await page.waitForSelector('text=ברוכים הבאים');
ok(true, 'wiped all data (onboarding shown)');
// restore: onboarding -> create a temp trip, then restore from settings
await page.getByRole('button', { name: 'יצירת הטיול שלי' }).click();
await page.goto(URL + '#/settings');
page.once('dialog', (d) => d.accept());
await page.locator('input[type=file][accept*=json]').setInputFiles(bkPath);
await pause(800);
const restored = await page.evaluate(() => new Promise((r) => { const q = indexedDB.open('trip-wallet'); q.onsuccess = () => { const s = q.result.transaction('expenses').objectStore('expenses'); const all = s.getAll(); all.onsuccess = () => r({ n: all.result.length, photos: all.result.filter((e) => e.receiptPhoto instanceof Blob).length }); }; }));
ok(restored.n === countBefore && restored.photos === 1, `restore brings back ${restored.n}/${countBefore} expenses and ${restored.photos} photo`);

// --- Budgets + alerts
await page.goto(URL + '#/settings');
const daily = page.locator('label:has-text("תקציב יומי") input');
await daily.fill('500');
await daily.press('Enter');
await pause();
await page.goto(URL + '#/home');
await pause(300);
ok((await page.locator('main').innerText()).includes('חריגה מהתקציב'), 'daily budget 100% alert shown');
ok((await page.locator('main').innerText()).includes('מתוך ₪500 תקציב יומי'), 'home shows "Today ₪X of ₪Y"');
await shot('08b-home-budget');

// --- Planning: estimated vs actual
await page.goto(URL + '#/settings/planning');
await page.getByRole('button', { name: /הוספת פריט מתוכנן/ }).click();
await sheet().locator('input').first().fill('Hostels');
await sheet().locator('select').selectOption('accommodation');
await sheet().locator('input[inputmode=decimal]').fill('800');
await sheet().getByRole('button', { name: 'שמירה' }).click();
await pause();
await page.locator('button.chip:has-text("🔗")').click();
await sheet().locator('input[type=checkbox]').first().check();
await pause();
await sheet().getByLabel('סגירה').click();
await pause();
const planText = await page.locator('main').innerText();
ok(planText.includes('₪1,000') && planText.includes('₪200'), 'planning shows actual ₪1,000 vs ₪800 (diff ₪200)');
await shot('08c-planning');

// --- Custom category
await page.goto(URL + '#/settings/categories');
await page.getByRole('button', { name: /קטגוריה חדשה/ }).click();
await sheet().getByLabel('שם (עברית)').fill('קפה');
await sheet().getByLabel('שם (אנגלית)').fill('Coffee');
await sheet().getByRole('button', { name: '☕' }).click();
await sheet().getByRole('button', { name: 'שמירה' }).click();
await pause();
ok((await page.locator('main').innerText()).includes('קפה'), 'custom category added');

// --- Language flip + dark mode
await page.goto(URL + '#/home');
await page.getByRole('button', { name: 'שפה' }).click();
await pause(300);
ok((await page.getAttribute('html', 'dir')) === 'ltr', 'English flips to LTR');
await shot('09-home-en');
await page.goto(URL + '#/stats');
await page.getByRole('button', { name: 'By category' }).click();
await pause(500);
await shot('10-stats-category-en');
await page.goto(URL + '#/settings');
await page.getByRole('radio', { name: /Dark/ }).click();
await pause(300);
ok(await page.evaluate(() => document.documentElement.classList.contains('dark')), 'dark mode applied');
await page.goto(URL + '#/home');
await pause(300);
await shot('11-home-dark-en');
await page.getByRole('button', { name: 'Language' }).click();
await pause(300);
ok((await page.getAttribute('html', 'dir')) === 'rtl', 'back to Hebrew flips to RTL');
await page.goto(URL + '#/wallet');
await pause(300);
await shot('12-wallet-dark-he');
await page.goto(URL + '#/stats');
await pause(300);
await shot('13-stats-dark-he');

// --- Offline
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await pause(500);
await ctx.setOffline(true);
await page.reload();
await page.waitForSelector('nav', { timeout: 10000 }).catch(() => {});
ok(await page.locator('nav').isVisible(), 'app opens offline (service worker)');
await page.goto(URL + '#/expenses');
await pause(300);
ok((await page.locator('main').innerText()).includes('לינה'), 'data visible offline');
await shot('14-offline');

await browser.close();
console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
