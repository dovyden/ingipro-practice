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

    off(type, listener) {
        // check type
        if (!this._listeners[type]) {
            return;
        }

        const index = this._listeners[type].indexOf(listener);

        // check is listener in list and remove one
        if (index > -1) {
            this._listeners[type].splice(index, 1);
        }
    }

    emit(type, data = {}) {
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
