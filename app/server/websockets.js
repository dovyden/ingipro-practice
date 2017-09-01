'use strict';

const randomColor = require('random-color');
const uuid = require('uuid/v4');
const store = require('./store');

const MAIN_CHANNEL = 'main';


module.exports = (socket) => {
    let user;

    /**
     * handles websocket messages
     */
    socket.on(MAIN_CHANNEL, ({type, payload}) => {
        switch (type) {
            case 'user:login':
                user = {
                    uuid: uuid(),
                    login: payload.login,
                    color: randomColor().hexString(),
                };

                store.addUser(user);

                socket.emit(MAIN_CHANNEL, {
                    type: 'user:logged',
                    payload: user,
                });
                socket.emit(MAIN_CHANNEL, {
                    type: 'conference:sync',
                    payload: store.getState(),
                });
                socket.broadcast.emit(MAIN_CHANNEL, {
                    type: 'user:join',
                    payload: user,
                });
                break;
        }
    });

    /**
     * handles client disconnect
     */
    socket.on('disconnect', () => {
        store.removeUser(user);

        socket.broadcast.emit(MAIN_CHANNEL, {
            type: 'user:leave',
            payload: user,
        });
    });
};
