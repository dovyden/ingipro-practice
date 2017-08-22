import io from 'socket.io-client';
import mediator from '../mediator';

const MAIN_CHANNEL = 'main';


class WebSocket {
    constructor() {
        // server events
        // this.socket = io.connect();

        this.socket = io.connect('ws://localhost:3000', {
            path: '/ws',
            transports: ['websocket'],
        });
        this.socket.on(MAIN_CHANNEL, this.onServerMessage.bind(this));

        // client events
        mediator.on('*', this.onMediatorMessage.bind(this));
    }

    onMediatorMessage(data, type) {
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

    onServerMessage(message) {
        const {type, payload} = message;
        payload.fromServer = true;

        // sync state
        mediator.emit(type, payload);
    }
}

// kind of Singleton pattern
export default new WebSocket();
