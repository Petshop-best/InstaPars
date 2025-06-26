const puppeteer = require('puppeteer');
const InstagramStats = require('./InstagramStats');
const { getInst } = require('./GetLists');
const {getAdditionalFields} = require('./GetAdditionalFields');

async function runStats(username, password, profileUrl) {
  console.log("runStats started with login = " + username + ", password " + password + ", and url =" + profileUrl);
  const stats = await getInst(username, password, profileUrl);
  await new Promise(resolve => setTimeout(resolve, 1000));
  const curAdditionalFields = await getAdditionalFields(stats.posts);
  console.log("CURRENT ADDITIONAL FIELDS: \n" + JSON.stringify(curAdditionalFields, null, 2));
  stats.setPostInfo(curAdditionalFields);
  return stats;
}

module.exports = { runStats };