'use strict';

const util = require('util');
const randomColor = require('random-color');
const uuid = require('uuid/v4');
const store = require('./store');

const MAIN_CHANNEL = 'main';


function debug(title, type, data) {
    /* eslint-disable no-console */
    console.log(`\n${title}`, type);
    console.log(util.inspect(data, {
        colors: true,
        depth: null,
    }));
    /* eslint-enable no-console */
}


module.exports = (socket) => {
    let user;

    function sendToUser(type, payload = {}) {
        debug(`[to ${user.login}]`, type, payload);

        socket.emit(MAIN_CHANNEL, {type, payload});
    }

    function sendToOthers(type, payload) {
        debug(`[to others (${user.login})]`, type, payload);

        socket.broadcast.emit(MAIN_CHANNEL, {type, payload});
    }

    /**
     * handles websocket messages
     */
    socket.on(MAIN_CHANNEL, ({type, payload}) => {
        debug(`[from ${user ? user.login : payload.login}]`, type, payload);

        switch (type) {
            /*
             * user login
             */
            case 'user:login': {
                user = {
                    uuid: uuid(),
                    login: payload.login,
                    color: randomColor().hexString(),
                };

                store.addUser(user);

                sendToUser('user:logged', user);
                sendToUser('conference:sync', store.getState());
                sendToOthers('user:join', user);
                break;
            }

            /*
             * control (un)lock
             */
            case 'layout:lock': {
                const status = store.lock(user);

                if (status) {
                    sendToUser('lock:accept', user); // @todo replace by `sendToAll`
                    sendToOthers('lock:accept', user);
                } else {
                    sendToUser('lock:reject', user);
                }

                break;
            }

            case 'layout:unlock': {
                const status = store.unlock(user);

                if (status) {
                    sendToOthers('lock:release', user);
                }

                break;
            }
        }
    });

    /**
     * handles client disconnect
     */
    socket.on('disconnect', () => {
        // ignire not logged user
        if (!user) {
            return;
        }

        // remove lock
        const status = store.unlock(user);
        if (status) {
            sendToOthers('lock:release', user);
        }

        // remove user
        store.removeUser(user);
        sendToOthers('user:leave', user);
    });
};
