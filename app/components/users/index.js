import mediator from '../mediator';
import './style.css';


class Users {
    constructor(domNode) {
        this._domNode = domNode;

        const onUserJoin = this._onUserJoin.bind(this);

        mediator.on('user:logged', onUserJoin);
        mediator.on('user:join', onUserJoin);
        mediator.on('user:leave', this._onUserLeave.bind(this));
        mediator.on('conference:sync', this._onConferenceSync.bind(this));
    }

    hide() {
        this._domNode.classList.add('users_hide');
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
        li.classList.add(`users__user_${user.uuid}`);
        li.appendChild(span);
        li.appendChild(document.createTextNode(user.login));

        return li;
    }

    _onUserJoin(user) {
        this._domNode.appendChild(this._createUserEntry(user));
    }

    _onUserLeave(user) {
        const li = this._domNode.querySelector(`.users__user_${user.uuid}`);
        if (!li) {
            return;
        }

        this._domNode.removeChild(li);
    }

    _onConferenceSync({users}) {
        const df = document.createDocumentFragment();
        users.forEach(user => {
            df.appendChild(this._createUserEntry(user));
        });

        this._domNode.innerHTML = ''; // drop items
        this._domNode.appendChild(df);
    }
}

export default Users;
