import mediator from '../mediator';


class Store {
    constructor() {
        mediator.on('user:logged', this._onUserLogged.bind(this));
    }

    get user() {
        return Object.assign({}, this._user);
    }

    _onUserLogged(user) {
        this._user = user;
    }
}

// kind of Singleton pattern
export default new Store();
