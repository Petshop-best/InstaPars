class Profile {
    constructor(id, url, is_active) {
        this._id = id;
        this._url = url;
        this._is_active = is_active;
        this._posts = [];
    }

    get posts() {
        return this._posts;
    }
    set posts(value) {
        this._posts = value;
    }
    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get url() {
        return this._url;
    }

    set url(value) {
        this._url = value;
    }

    get is_active() {
        return this._is_active;
    }

    set is_active(value) {
        this._is_active = value;
    }
}
module.exports = Profile;