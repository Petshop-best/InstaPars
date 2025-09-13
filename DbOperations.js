const pool = require('./db');

async function insertProfileUrl(url){
    return pool.query(
        'INSERT INTO compet_inst (url, is_active) VALUES ($1, true) ON CONFLICT (url) DO NOTHING', [url]
    );
}
async function getFullProfile(url) {
    return pool.query(
        'SELECT * FROM compet_inst WHERE url = $1', [url]
    )
}
async function getProfilesPosts(id, date) {
    return pool.query(
        'SELECT * FROM compet_post WHERE competitor = $1 AND posr_date >= $2', [id, date]
    )
}
async function insertPost(post) {
    return pool.query(
        `INSERT INTO compet_post (competitor, post_url, posr_date, content, views, isreels, collab_with) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (post_url) DO NOTHING`,
        [post.competitor, post.post_url, post.posr_date, post.content, post.views, post.isreels, post.collab_with]
    );
}
async function getUnhandledStore() {
    return pool.query(
        'SELECT site_url FROM store WHERE is_handled IS DISTINCT FROM true'
    )
}
async function markStoreHandled(url, emails){
    return pool.query(
        'UPDATE store SET is_handled = true, email = $2 WHERE site_url = $1', [url, emails]
    )
}
module.exports = { insertProfileUrl, getFullProfile, getProfilesPosts, insertPost, getUnhandledStore, markStoreHandled };