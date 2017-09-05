import mediator from '../mediator';
import './style.css';


class Users {
    constructor(domNode) {
        this._domNode = domNode;

        this._users = {};

        const onUserJoin = this._onUserJoin.bind(this);

        mediator.on('layout:unlock', this._onLayoutUnlock.bind(this));
        mediator.on('lock:accept', this._onLayoutLock.bind(this));
        mediator.on('lock:release', this._onLayoutUnlock.bind(this));
        mediator.on('conference:sync', this._onConferenceSync.bind(this));
        mediator.on('user:join', onUserJoin);
        mediator.on('user:leave', this._onUserLeave.bind(this));
        mediator.on('user:logged', onUserJoin);
    }

    hide() {
        this._domNode.classList.add('users_hide');

        // reset user list
        this._resetList();
    }

    show() {
        this._domNode.classList.remove('users_hide');
    }

    _createUserEntry(user) {
        const span = document.createElement('span');
        span.classList.add('users__color');
        span.style.background = user.color;

        const li = document.createElement('li');
        li.classList.add('users__user');
        li.appendChild(span);
        li.appendChild(document.createTextNode(user.login));

        return li;
    }

    _resetList() {
        Object.values(this._users).forEach(userNode => userNode.remove());
    }

    _onLayoutLock(user) {
        this._users[user.uuid].classList.add('users__user_active');
    }

    _onLayoutUnlock(user) {
        this._users[user.uuid].classList.remove('users__user_active');
    }

    _onConferenceSync({users}) {
        // drop items
        this._resetList();

        // create list
        const df = document.createDocumentFragment();
        users.forEach(user => {
            const userNode = this._createUserEntry(user);
            this._users[user.uuid] = userNode;

            df.appendChild(userNode);
        });

        // append list
        this._domNode.appendChild(df);
    }

    _onUserJoin(user) {
        const userNode = this._createUserEntry(user);
        this._users[user.uuid] = userNode;

        this._domNode.appendChild(userNode);
    }

    _onUserLeave(user) {
        const userNode = this._users[user.uuid];

        if (userNode) {
            userNode.remove();
        }
    }
}

export default Users;
