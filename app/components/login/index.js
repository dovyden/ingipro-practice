import mediator from '../mediator';
import './style.css';


class Login {
    constructor(domNode) {
        this._domNode = domNode;
        this._loginNode = this._domNode.querySelector('.js-login-login');

        this._onFormSubmit = this._onFormSubmit.bind(this);

        domNode.addEventListener('submit', this._onFormSubmit); // form
        domNode.querySelector('.js-login-btn').addEventListener('click', this._onFormSubmit); // submit button
    }

    hide() {
        this._domNode.classList.add('login_hide');

        // reset form
        this._loginNode.value = '';
    }

    show() {
        this._domNode.classList.remove('login_hide');
    }

    _onFormSubmit(e) {
        e.preventDefault();

        const login = this._loginNode.value.trim();

        // check login
        if (!login) {
            return;
        }

        // request to login
        mediator.emit('user:login', {login});
    }
}

export default Login;
