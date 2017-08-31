// components
import Layout from '../layout';
import Login from '../login';
import mediator from '../mediator'; // instance of component
import Users from '../users';
import '../store';
import '../voice';
import '../websocket';

// base styles
import './style.css';

// create instanses of ui components
const layout = new Layout(document.querySelector('.layout'));
const login = new Login(document.querySelector('.login'));
const users = new Users(document.querySelector('.users'));

// init, show login form
login.show();

// wait to login
mediator.on('user:logged', () => {
    login.hide();
    layout.show();
    users.show();
});