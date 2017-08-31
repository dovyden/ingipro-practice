'use strict';

const store = {
    users: [],
};

module.exports = {
    getState() {
        return store;
    },

    /* users
     */

    addUser(user) {
        store.users.push(user);
    },
    removeUser(user) {
        store.users = store.users.filter(item => item !== user);
    },
};
