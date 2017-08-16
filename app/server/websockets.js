'use strict';

// const store = require('./store');


module.exports = (socket) => {
    /**
     * handles websocket messsages
     */
    socket.on('message', ({type, payload}) => {
        // ..

        // /**
        //  * notify others about new user after connection
        //  * and sync state of new user
        //  */
        // socket.emit('message', {
        //     type: 'conference:sync',
        //     payload: store.getState()
        // })
        // socket.broadcast.emit({
        //     type: 'user:join',
        //     payload: {
        //         id: 'uuid4', // fixme
        //         login:
        //     }
        // });

        // eslint-disable-next-line
        console.log('message:', `${type}:`, payload);
    });

    /**
     * handles client disconnect
     */
    socket.on('disconnect', () => {
        // ..

        // eslint-disable-next-line
        console.log('user disconected');
    });
};
