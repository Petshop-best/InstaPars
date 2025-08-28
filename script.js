const puppeteer = require('puppeteer');
const InstagramStats = require('./InstagramStats');
const { getInst, getLoggedPage, getPostDatesNew, getReelsDataNew } = require('./GetLists');
const {getAdditionalFields,getDateOfPage} = require('./GetAdditionalFields');
const {insertNewUrls, getFullProfileEntities, fullfillProfilePosts, insertNewPosts} = require('./UrlOperations');

async function runStats(username, password, profileUrl) {
  console.log("runStats started with login = " + username + ", password " + password + ", and url =" + profileUrl);
  const stats = await getInst(username, password, profileUrl);
  await new Promise(resolve => setTimeout(resolve, 1000));
  const curAdditionalFields = await getAdditionalFields(stats.posts);
  console.log("CURRENT ADDITIONAL FIELDS: \n" + JSON.stringify(curAdditionalFields, null, 2));
  stats.setPostInfo(curAdditionalFields);
  return stats;
}

async function runNewStats(username, password, profileUrls, dataFrom) {
  console.log("runNewStats started with login = " + username + ", password " + password);
  const profiles = []
  for (const profileUrl of profileUrls) {
    await insertNewUrls([profileUrl]);
    profiles.push(await getFullProfileEntities(profileUrl));
  }
  for (const profile of profiles) {
    fullfillProfilePosts(profile, dataFrom);
  }
  let page = null;
  let attempts = 0;
  const delays = [60000, 120000, 300000, 1800000, 3600000];
  const MAX_ATTEMPTS = 5;
  do  {
    page = await getLoggedPage(username, password)
    if (page === null){
      attempts++;
      console.log(`Login attempt ${attempts} failed — retrying in ${delays[attempts - 1] / 1000} seconds...`);
      if (attempts >= MAX_ATTEMPTS) {
      throw new Error('Too many failed login attempts');
    }
      await new Promise(resolve => setTimeout(resolve, delays[attempts-1]));
    }
  } while (page == null)

  for (const profile of profiles) {
    const newPage = await page.browser().newPage();
    const newPostArray = await getPostDatesNew(newPage, profile);
    const filteredPosts = newPostArray.filter(post => 
      !profile.posts.some(existing => existing.post_url === post.post_url)
    );
    console.log("New posts array length is " + filteredPosts.length);
    if (filteredPosts.length >0){
      for (const post of filteredPosts){
        const additionalFields = await getDateOfPage(newPage, post.post_url);
        console.log('Description is - ' + additionalFields.description + ' and date is - ' + additionalFields.datetime)
        post.posr_date = additionalFields.datetime;
        post.content = additionalFields.description;
      }
      const newReelsArray = await getReelsDataNew(newPage, profile);
      console.log("New reels array length is " + newReelsArray.length);
      for (const post of filteredPosts){
        const matchingReels = newReelsArray.filter(reel => {
          const reelId = extractReelId(reel.href);
          const postId = extractReelId(post.post_url);
          return reelId && postId && reelId === postId;
        });
        if (matchingReels.length > 0) {
          post.isreels = true;
          post.views = matchingReels[0].views.replace(/,/g, ''); // Remove commas from views count
        }
        else {
          post.isreels = false;
          post.views = 0; 
        }
        const autor = extractAutor(post.post_url);
        const accountOwner = extractAutor(profile.url);
        console.log(`Post URL: ${post.post_url}, Autor: ${autor}, Account Owner: ${accountOwner}`);
        if ( autor && accountOwner && autor !== accountOwner ) {
          post.collab_with = autor;
        }
      }
      await insertNewPosts(filteredPosts);
      profile.posts = profile.posts.concat(filteredPosts);
    }
    const filteredByDatePosts = profile.posts.filter(post => new Date (post.posr_date) >= new Date (dataFrom));
    profile.posts = filteredByDatePosts;
    console.log("Current profile" + JSON.stringify(profile, null, 2));
    newPage.close();
  }
page.close();
return profiles;

}
function extractReelId(url) {
  return url.split("/reel/")[1]?.split("/")[0] || null;
}
function extractAutor(url) {
  return url.split("instagram.com/")[1]?.split("/")[0] || null;
}


module.exports = { runStats, runNewStats };