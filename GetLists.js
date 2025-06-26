const puppeteer = require('puppeteer');
const InstagramStats = require('./InstagramStats');
const e = require('express');

async function getInst(username, password, targetChannel) {
  const browser = await puppeteer.launch({
    headless: 'new', // без окна
    args: ['--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-zygote',
    '--disable-accelerated-2d-canvas',
    '--disable-web-security'],
  protocolTimeout: 60000
  });

  const page = await browser.newPage();
    console.log("creating new page");
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36');
  console.log("going to instagram");
  await page.goto('https://www.instagram.com/');
  const title = await page.title();
  console.log("Trying to login");

  //login
  await page.waitForSelector('input[name="username"]');
  console.log("w8 for username");
  await page.waitForSelector('input[name="password"]');
  console.log("w8 for password");
  await page.type('input[name="username"]', username, {delay: 100});
  console.log("Typing username like " + username);
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("w8 for typing password");
  await page.type('input[name="password"]', password, {delay: 100});
  console.log("Typing password like " + password);
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("log before submiting");
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 15000 }).catch(() => {
  console.log('Navigation timeout — fallback to manual wait');
});

  console.log("submiting login");

  await page.waitForSelector('button');

  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text.trim() === 'Save info') {
      console.log("Save button pressed");
      await btn.click();
      break;
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 10000));

  const postStat = await getPostDates(page, targetChannel);
  const reelsStat = await getReelsDatas(page, targetChannel +'reels/');
  await browser.close();
  const instStats = new InstagramStats(postStat, reelsStat);
  return instStats;
}

async function getPostDates(page, link) {
  console.log("in getPostDates " + link);
  const blocked = ['image', 'stylesheet', 'font', 'media'];
  await page.setRequestInterception(true);
  page.removeAllListeners('request');
  page.on('request', request => {
    if (blocked.includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  });
  try {
    await page.goto(link, { timeout: 10000 });
    console.log("✅ Страница загружена");
  } catch (e){
    console.log("ERROR! Ошибка при загрузке страницы:", e.message);
  }
  console.log("Before resolve");
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("before for");
  if (!page) {
  console.error("Page is not initialized");
  }

  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
  };
  await new Promise(resolve => setTimeout(resolve, 10000));
  console.log("Scrolled");
  const data = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('a[href*="/reel/"]'));
    return items.map(a => {
      const img = a.querySelector('img');
      return {
        href: a.href,
        imgSrc: img?.src || null,
        alt: img?.alt || '',
      };
    });
  });
  console.log(JSON.stringify(data, null, 2));
  const hrefArray = data.map(item => item.href);
  
  return hrefArray;
}

async function getReelsDatas(page, link){
    const blocked = ['image', 'stylesheet', 'font', 'media'];
  await page.setRequestInterception(true);
  page.removeAllListeners('request');
  page.on('request', request => {
    if (blocked.includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  });
  await page.goto(link, { timeout: 10000 });
  await new Promise(resolve => setTimeout(resolve, 1000));
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
  };
  await new Promise(resolve => setTimeout(resolve, 10000));
  const reelsData = await page.$$eval('a[href*="/reel/"]', anchors => {
    return anchors.map(a => {
      // ссылка
      const href = a.getAttribute('href');

      // поиск span с количеством просмотров внутри (с классом html-span)
      const viewsSpan = Array.from(a.querySelectorAll('span')).find(el =>
      /^\d+([.,]?\d+)?[KM]?$/.test(el.textContent.trim())
    );
      const views = viewsSpan ? viewsSpan.textContent.trim() : null;
      return {href, views};
    });
  });
  console.log(reelsData);
  return reelsData;
}

console.log('Экспортируем:', { getInst });
module.exports = { getInst };