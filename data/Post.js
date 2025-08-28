class Post{
    constructor(id, competitor, post_url, posr_date, content, views, isreels, collab_with){
        this._id = id ?? null;
        this._competitor = competitor ?? null;
        this._post_url = post_url ?? null;
        this._posr_date = posr_date ?? null;
        this._content = content ?? null;
        this._views = views ?? null;
        this._isreels = isreels ?? null;
        this._collab_with = collab_with ?? null;
    }
    get id() {
        return this._id;
    }
    set id(value) {
        this._id = value;
    }

    get competitor() {
        return this._competitor;
    }
    set competitor(value) {
        this._competitor = value;
    }

    get post_url() {
        return this._post_url;
    }
    set post_url(value) {
        this._post_url = value;
    }

    get posr_date() {
        return this._posr_date;
    }
    set posr_date(value) {
        this._posr_date = value;
    }

    get content() {
        return this._content;
    }
    set content(value) {
        this._content = value;
    }

    get views() {
        return this._views;
    }
    set views(value) {
        this._views = value;
    }

    get isreels() {
        return this._isreels;
    }
    set isreels(value) {
        this._isreels = value;
    }

    get collab_with() {
        return this._collab_with;
    }
    set collab_with(value) {
        this._collab_with = value;
    }
}
module.exports = Post;