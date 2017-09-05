import io from 'socket.io-client';
import mediator from '../mediator';

const MAIN_CHANNEL = 'main';


class WebSocket {
    constructor() {
        this.socket = io.connect('ws://localhost:3000', {
            path: '/ws',
            transports: ['websocket'],
        });
        this.socket.on(MAIN_CHANNEL, this._onServerMessage);
        this.socket.on('disconnect', this._onDisconnect);

        // client events
        mediator.on('*', this._onMediatorMessage.bind(this));
    }

    _onMediatorMessage(data, type) {
        // skip messages from server
        if (data.fromServer) {
            return;
        }

        // send data to others
        this.socket.emit(MAIN_CHANNEL, {
            type,
            payload: data,
        });
    }

    _onServerMessage(message) {
        const {
            type,
            payload = {},
        } = message;

        payload.fromServer = true;

        // sync state
        mediator.emit(type, payload);
    }

    _onDisconnect() {
        mediator.emit('conference:reset', {
            fromServer: true,
        });
    }
}

// kind of Singleton pattern
export default new WebSocket();
