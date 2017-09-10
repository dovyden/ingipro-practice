'use strict';

const store = {
    layout: null,
    lock: null,
    users: [],
};

module.exports = {
    _store: Object.assign({}, store),

    getState() {
        return this._store;
    },

    reset() {
        this._store = Object.assign({}, store);

        return this;
    },

    /*
     * users
     */

    addUser(user) {
        this._store.users.push(user);

        return this;
    },

    removeUser(user) {
        this._store.users = this._store.users.filter(item => item.uuid !== user.uuid);

        // check empty conference
        if (!this._store.users) {
            this.reset();
        }

        return this;
    },

    /*
     * control (un)lock
     */

    isLockedBy(user) {
        const {lock} = this._store;

        return lock && lock.uuid === user.uuid;
    },

    lock(user) {
        const {lock} = this._store;

        if (lock && lock.uuid !== user.uuid) {
            return false;
        }

        this._store.lock = user;

        return true;
    },

    unlock(user) {
        const {lock} = this._store;

        if (!lock || lock.uuid !== user.uuid) {
            return false;
        }

        this._store.lock = null;

        return true;
    },

    /*
     * layout
     */

    updateLayout(layout) {
        this._store.layout = layout;
    },
};
