// import Marks from '../marks';
// import Viewer from '../viewer';
import './style.css';


class Layout {
    constructor(domNode) {
        // @fixme remove `console.log`
        // eslint-disable-next-line
        console.log('"Layout" created');

        this._domNode = domNode;
    }

    hide() {
        this._domNode.classList.add('layout_hide');
    }

    show() {
        this._domNode.classList.remove('layout_hide');
    }
}

export default Layout;
