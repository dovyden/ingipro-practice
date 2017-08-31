class Mediator {
    constructor() {
        this._listeners = {};
    }

    on(type, listener) {
        if (!this._listeners[type]) {
            this._listeners[type] = [];
        }

        this._listeners[type].push(listener);
    }

    emit(type, data) {
        const fired = [];

        // type like 'user:add'
        if (this._listeners[type]) {
            this._listeners[type].forEach(listener => {
                listener.call(null, data, type);
                fired.push(listener);
            });

            fired.concat(this._listeners[type]);
        }

        // type like 'user:*'
        const typeWithPattern = `${type.split(':')[0]}:*`;
        if (this._listeners[typeWithPattern]) {
            this._listeners[typeWithPattern]
                .filter(listener => !fired.includes(listener))
                .forEach(listener => {
                    listener.call(null, data, type);
                    fired.push(listener);
                });
        }

        // type like '*'
        if (this._listeners['*']) {
            this._listeners['*']
                .filter(listener => !fired.includes(listener))
                .forEach(listener => listener.call(null, data, type));
        }
    }
}

// kind of Singleton pattern
export default new Mediator();
