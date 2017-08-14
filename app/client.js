import Layout from 'components/layout';
import Login from 'components/login';
import Users from 'components/users';
import mediator from 'components/mediator'; // instance of component
import 'components/store';
import 'components/voice';
import 'components/websocket';

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
