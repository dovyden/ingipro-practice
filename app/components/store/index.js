import mediator from '../mediator';


class Store {
    constructor() {
        this._lock = false;
        this._user = null;
        this._lockUser = null;

        mediator.on('user:logged', this._onUserLogged.bind(this));
        mediator.on('layout:unlock', this._onLayoutUnlock.bind(this));
        mediator.on('lock:accept', this._onLayoutLock.bind(this));
        mediator.on('lock:release', this._onLayoutUnlock.bind(this));
    }

    get lock() {
        return this._lock;
    }

    get lockByMe() {
        return this._lock && this._user.uuid === this._lockUser.uuid;
    }

    get user() {
        return Object.assign({}, this._user);
    }

    _onUserLogged(data) {
        var user = Object.assign({}, data);
        delete user.fromServer; // Um, it may be ugly hack

        this._user = user;
    }

    _onLayoutLock(user) {
        this._lock = true;
        this._lockUser = user;
    }

    _onLayoutUnlock() {
        this._lock = false;
        this._lockUser = null;
    }
}

// kind of Singleton pattern
export default new Store();
