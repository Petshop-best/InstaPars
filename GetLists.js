const puppeteer = require('puppeteer');
const InstagramStats = require('./InstagramStats');
const e = require('express');
const Post = require('./data/Post');
const Profile = require('./data/Profile');  

async function getLoggedPage(username, password) {
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
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36');
  await page.goto('https://www.instagram.com/');
  const title = await page.title();
  console.log("Current page title is " + title);

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
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 15000 }).catch(() => {
    console.log('Navigation timeout — fallback to manual wait');
  });
  const isCaptchaPresent = await detectCaptcha(page);
  if (isCaptchaPresent) {
    console.log('🛑 CAPTCHA detected after login!');
    await browser.close();
    return null;
  }
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
  return page;
}

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
async function getPostDatesNew(page, profile) {
  console.log("in getPostDatesNew " + profile._url);
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
    await page.goto(profile._url, { timeout: 10000, waitUntil: 'domcontentloaded' });
    console.log("✅ Страница загружена");
  } catch (e) {
    console.log("ERROR! Ошибка при загрузке страницы:", e.message);
    return [];
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight * 3);
  });
  await new Promise(r => setTimeout(r, 1000));

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
  const filteredData = data.filter(item =>
    !profile.posts.some(post => post.post_url === item.href)
  )
  console.log(JSON.stringify(filteredData, null, 2));
  console.log('Filtered data:', filteredData);
  // const postArray = filteredData.map(item => new Post({competitor: profile._id, post_url: item.href}));
  const postArray = filteredData.map(item => {
  console.log("Creating Post for href:", item.href); // выводим в консоль
    return new Post(
    null,              // id
    profile._id,       // competitor
    item.href,         // post_url
    null,              // posr_date
    item.alt,              // content
    null,              // views
    null,              // isreels
    null               // collab_with
);
});
  return postArray;
}
async function getReelsDataNew(page, profile) {
  console.log("in getReelsDataNew " + profile._url);
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
    await page.goto(profile._url +'/reels/', { timeout: 10000, waitUntil: 'domcontentloaded' });
    console.log("✅ Страница загружена");
  } catch (e) {
    console.log("ERROR! Ошибка при загрузке страницы:", e.message);
    return [];
  }
  await new Promise(resolve => setTimeout(resolve, 20000));
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight * 3);
  });
  await new Promise(r => setTimeout(r, 60000));
  console.log('URL сейчас:', await page.evaluate(() => location.href));
  page.on('console', msg => console.log('[BROWSER]', msg.text()));
  const reelsData = await page.$$eval('a[href*="/reel/"]', anchors => {
    return anchors.map(a => {
      // ссылка
      const href = a.getAttribute('href');
      console.log("Found reel href:", href);

      // поиск span с количеством просмотров внутри (с классом html-span)
      const viewsSpan = Array.from(a.querySelectorAll('span')).find(el =>
      /^\d+([.,]?\d+)?[KM]?$/.test(el.textContent.trim())
    );
    let views = viewsSpan ? viewsSpan.textContent.trim() : null;
    console.log("Found views span:", viewsSpan ? viewsSpan.textContent.trim() : 'none');
    if (views) {
      if (views.endsWith("K")) {
        views = views.replace("K", "000");      // 10,5K -> 10,500
      } else if (views.endsWith("M")) {
        views = views.replace("M", "000000");   // 1.2M -> 1.200000
      }
    }
      return {href, views};
    });
  });
  console.log("Внутри метода reelsData length =", reelsData.length);
  return reelsData;
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

async function detectCaptcha(page) {
  if (!page || typeof page.$x !== 'function') {
    console.error("detectCaptcha: передан некорректный объект page", page);
    return false;
  }

  const captchaFrame = await page.$('iframe[src*="recaptcha"]');
  if (captchaFrame) return true;

  if (page.url().includes('/challenge/')) return true;

  const captchaTextNodes = await page.$x(
    "//*[contains(text(), 'verify') or contains(text(), 'captcha') or contains(text(), 'Please wait')]"
  );
  if (captchaTextNodes.length > 0) return true;

  return false;
}

console.log('Экспортируем:', { getInst });
module.exports = { getInst, getLoggedPage,  getPostDatesNew, getReelsDataNew};