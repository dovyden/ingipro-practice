import mediator from '../mediator';


class Store {
    constructor() {
        this._lock = false;
        this._lockUser = null;
        this._user = null;

        mediator.on('conference:reset', this._onConferenceReset.bind(this));
        mediator.on('layout:unlock', this._onLayoutUnlock.bind(this));
        mediator.on('lock:accept', this._onLayoutLock.bind(this));
        mediator.on('lock:release', this._onLayoutUnlock.bind(this));
        mediator.on('user:logged', this._onUserLogged.bind(this));
    }

    get lock() {
        return this._lock;
    }

    get lockByMe() {
        return this._lock && this._user && this._user.uuid === this._lockUser.uuid;
    }

    get user() {
        return this._user ? Object.assign({}, this._user) : null;
    }

    _onConferenceReset() {
        this._lock = false;
        this._lockUser = null;
        this._user = null;
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
