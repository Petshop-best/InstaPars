const puppeteer = require('puppeteer');
const { getUnhandledStore, markStoreHandled } = require('./DbOperations');   
async function runStoreInfo() {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    try {
        const result = await getUnhandledStore();
        if (result.rows.length === 0) {
            console.log('No unhandled store found');
            return;
        }  
        for (const row of result.rows) {
            const url = row.site_url;
            console.log(`Processing URL: ${url}`);
            try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            const foundEmails = new Set();
            const collectEmails = async () => {
                return await page.evaluate(() => {
                const emails = new Set();

                // 1️⃣ mailto: ссылки
                document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
                    emails.add(a.href.replace('mailto:', '').trim());
                });

                // 2️⃣ текст страницы
                const bodyText = document.body.innerText;
                const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
                const matches = bodyText.match(regex);
                if (matches) matches.forEach(m => emails.add(m.trim()));

                return Array.from(emails);
                });
            };
            (await collectEmails()).forEach(e => foundEmails.add(e));
            const contactLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .filter(a => 
                        /about|contact/i.test(a.innerText) ||
                        /facebook\.com/i.test(a.href))
                .map(a => a.href);
        });
            for (const link of contactLinks) {
            try {
                console.log(`Visiting contact link: ${link}`);
                await page.goto(link, { waitUntil: 'domcontentloaded' });
                if (link.includes('facebook.com')) {
                    await page.waitForSelector('div[aria-label="Close"]', { timeout: 5000 });
                    await page.click('div[aria-label="Close"]');
                }
                (await collectEmails()).forEach(e => foundEmails.add(e));
            } catch (err) {
                console.warn(`Can't open ${link}: ${err.message}`);
            }
        }
            if (foundEmails.size) {
                console.log(`Found emails on ${url}: ${Array.from(foundEmails).join(', ')}`);
                const emailString = Array.from(foundEmails).join(', ');
                await markStoreHandled(url, emailString);
            } else {
                console.log(`No email found on ${url}`);
                await markStoreHandled(url, null);
            }
        } catch (err) {
            console.error(`Error processing ${url}:`, err);
            await markStoreHandled(url, null);
        }
        }
    } catch (err) {
        console.error('Error fetching unhandled store:', err);
    }
    await browser.close();  
}
module.exports = { runStoreInfo };