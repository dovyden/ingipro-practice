import './style.css';


class Users {
    constructor(domNode) {
        // @fixme remove `console.log`
        // eslint-disable-next-line
        console.log('"Users" created');

        this._domNode = domNode;
    }

    hide() {
        this._domNode.classList.add('users_hide');
    }

    show() {
        this._domNode.classList.remove('users_hide');
    }
}

export default Users;
