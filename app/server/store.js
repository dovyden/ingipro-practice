'use strict';

const store = {
    lock: null,
    users: [],
};

module.exports = {
    _store: store,

    getState() {
        return this._store;
    },

    reset() {
        this._store = store;

        return this;
    },

    /*
     * users
     */

    addUser(user) {
        this._store.users = [
            ...this._store.users,
            user,
        ];

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
};
