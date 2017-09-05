// import Marks from '../marks';
// import Viewer from '../viewer';
import mediator from '../mediator';
import store from '../store';
import './style.css';


class Layout {
    constructor(domNode) {
        this._domNode = domNode;

        this._keyCtrl = false;
        this._keyShift = false;

        this._onContextMenu = this._onContextMenu.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
    }

    hide() {
        this._domNode.classList.add('layout_hide');
        this._resetLayout();
    }

    show() {
        this._domNode.classList.remove('layout_hide');
        this._initLayout();
    }

    _initLayout() {
        // add event hanlers
        this._domNode.addEventListener('click', this._onClick, false);
        this._domNode.addEventListener('contextmenu', this._onContextMenu);
        document.addEventListener('keydown', this._onKeyPress);
        document.addEventListener('keyup', this._onKeyPress);
    }

    _resetLayout() {
        // remove event handlers
        this._domNode.removeEventListener('click', this._onClick);
        this._domNode.removeEventListener('contextmenu', this._onContextMenu);
        document.removeEventListener('keydown', this._onKeyPress);
        document.removeEventListener('keyup', this._onKeyPress);
    }

    _onKeyPress(e) {
        const lockAction = e.ctrlKey;

        this._keyCtrl = lockAction;
        this._keyShift = e.shiftKey;

        // try to lock layout
        if (lockAction && !store.lock) {
            mediator.emit('layout:lock', store.user);

        // unlock layout
        } else if (!lockAction && store.lockByMe) {
            mediator.emit('layout:unlock', store.user);
        }
    }

    _onContextMenu(e) {
        e.preventDefault();
    }
}

export default Layout;
