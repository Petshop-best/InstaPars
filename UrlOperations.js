const {insertProfileUrl, getFullProfile, getProfilesPosts, insertPost } = require('./DbOperations');
const Profile = require('./data/Profile');
const Post = require('./data/Post');   

async function insertNewUrls(urlList) {
    console.log("Starting insertion to url");
    for (const url of urlList)
        await insertProfileUrl(url);
}
async function getFullProfileEntities(url){
    console.log("Getting full profile for url: " + url);
    const result = await getFullProfile(url);
    if (result.rows.length === 0) {
        throw new Error(`No profile found for URL: ${url}`);
    }
    const row = result.rows[0];
    return new Profile(row.id, row.url, row.is_active);
}
async function fullfillProfilePosts(profile, dateAfter) {
    console.log("Fulfilling profile posts for url: " + profile.id);
    const result = await getProfilesPosts(profile.id, dateAfter);
    if (result.rows.length === 0) {
        console.log(`No posts found for URL: ${profile.url}`);
        return;
    }
    profile.posts = result.rows.map(row => {
        return new Post(row.id, row.competitor, row.post_url, row.posr_date, row.content, row.views, row.isreels, row.collab_with);
    });
    console.log(`Found ${profile.posts.length} posts for URL: ${profile.url}`);
}
async function insertNewPosts(postList) {
    for (const post of postList) {
        await insertPost(post);
    }
}
module.exports = {insertNewUrls, getFullProfileEntities, fullfillProfilePosts, insertNewPosts};