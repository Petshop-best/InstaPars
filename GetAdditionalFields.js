const puppeteer = require('puppeteer');

async function getAdditionalFields(linkArray){
  const browser = await puppeteer.launch({
    headless: 'new', // без окна
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

    let resMap = new Map();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36');
    await page.goto('https://www.instagram.com/');
    for(const item of linkArray){
        const resDate = await getDateOfPage(page, item);
        console.log(resDate);
        resMap.set(item, resDate);
    }
    console.log("resMap geted" + Object.fromEntries(resMap));
    await browser.close();
    return Object.fromEntries(resMap);
}

async function getDateOfPage(page, link) {
    await page.goto(link, { timeout: 5000 });
    try{
        await page.waitForSelector('div[role="button"] svg[aria-label="Close"]', { visible: true });
        await page.click('div[role="button"] svg[aria-label="Close"]');
    } catch(e){
        console.log('Кнопка "Close" не найдена — продолжаем без закрытия');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.waitForSelector('time', { timeout: 10000 });
    const datetime = await page.evaluate(() => {
    const timeElem = document.querySelector('time');
    return timeElem?.getAttribute('datetime') || null;
    });
    const description = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="description"]');
        return meta?.getAttribute('content') || null;
    });
    console.log(description);
    console.log(datetime);
    return {description, datetime};
}
module.exports = { getAdditionalFields, getDateOfPage };