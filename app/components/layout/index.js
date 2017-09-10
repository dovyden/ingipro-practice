import throttle from 'lodash/throttle';
// import Marks from '../marks';
// import Viewer from '../viewer';
import mediator from '../mediator';
import store from '../store';
import {
    Cell,
    CLASS_CONTROL,
    CONTROL_AXIS_X,
    CONTROL_AXIS_Y,
} from './cell';
import './style.css';

const DEFAULT_CELL_UUID = '68c80880-8d46-4cce-b5d8-9e830fab87f7';
const MIN_DELTA = 25;
const MIN_BASIS = 20;
const THROTTLE_TIMEOUT = 80; // 5 frames


class Layout {
    constructor(domNode) {
        this._domNode = domNode;

        this._layout = null; // layout tree
        this._uuids = null; // fast search of cell
        this._lock = false; // locked control flag
        this._noteMode = false; // notes flag
        this._dnd = false; // drag and drop data

        this._onContextMenu = this._onContextMenu.bind(this); // fix ctrl on mac
        this._onKeyPress = this._onKeyPress.bind(this); // keyboard
        this._onMouseDown = this._onMouseDown.bind(this); // drag & drop
        this._onMouseMove = throttle(this._onMouseMove.bind(this), THROTTLE_TIMEOUT);
        this._onMouseUp = throttle(this._onMouseUp.bind(this), THROTTLE_TIMEOUT);
        this._handleDragAndDrop = this._handleDragAndDrop.bind(this);

        mediator.on('conference:sync', this._onConferenceSync.bind(this));
        mediator.on('layout:change', this._onLayoutChange.bind(this));
        mediator.on('layout:unlock', this._onLayoutChange.bind(this));
        mediator.on('lock:accept', this._onLayoutLock.bind(this));
    }

    hide() {
        this._domNode.classList.add('layout_hide');
        this._resetLayout();
    }

    show() {
        this._initLayout();
        this._domNode.classList.remove('layout_hide');
    }

    /*
     * dom methods
     */

    _initLayout() {
        // create base layout
        this._createBaseLayout();

        // add event hanlers
        document.addEventListener('keydown', this._onKeyPress);
        document.addEventListener('keyup', this._onKeyPress);
    }

    _resetLayout() {
        // remove event handlers
        document.removeEventListener('keydown', this._onKeyPress);
        document.removeEventListener('keyup', this._onKeyPress);

        // reset to base layout
        if (this._layout) {
            this._layout.remove();
            this._layout = null;
        }
    }

    _createBaseLayout() {
        // create cell
        this._layout = new Cell({uuid: DEFAULT_CELL_UUID});

        // add cell to dom
        this._domNode.appendChild(this._layout.node);
    }

    _syncLayout(layout, data) {
        // recreate layout
        if (this._layout.uuid !== layout.uuid) {
            this._layout.remove();
            this._layout = new Cell(layout, data);

        // create viewer and marks
        } else {
            this._layout.sync(layout, data);
        }
    }

    /*
     * event handlers
     */

    _onConferenceSync(data) {
        // check login and layout data
        if (!store.user || !data.layout) {
            return;
        }

        this._syncLayout(data.layout, data);
    }

    _onContextMenu(e) {
        e.preventDefault();
    }

    _onKeyPress(e) {
        const lockAction = e.ctrlKey;
        this._noteMode = e.shiftKey;

        // try to lock layout
        if (lockAction && !store.lock) {
            mediator.emit('layout:lock', store.user);

        // unlock layout
        } else if (!lockAction && store.lockByMe) {
            this._onLayoutUnock();
        }
    }

    _onLayoutChange(data) {
        // check login and is it own message
        if (!store.user || !data.fromServer) {
            return;
        }

        this._syncLayout(data);
    }

    _onLayoutLock(user) {
        const lock = store.user && store.user.uuid === user.uuid;
        this._lock = lock;

        // switch to interactive mode
        if (lock) {
            this._domNode.addEventListener('contextmenu', this._onContextMenu);
            this._domNode.addEventListener('mousedown', this._onMouseDown);

            this._domNode.classList.add('layout_interactive');
        }
    }

    _onLayoutUnock() {
        if (!store.lockByMe) {
            return;
        }

        this._lock = false;

        // finish drag & drop
        if (this._dnd) {
            this._onMouseUp();
        }

        // remove listeners
        this._domNode.removeEventListener('contextmenu', this._onContextMenu);
        this._domNode.removeEventListener('mousedown', this._onMouseDown);

        this._domNode.classList.remove('layout_interactive');

        mediator.emit('layout:unlock', store.user);
    }

    /**
     * starts handling of moves of controls
     *
     * @param {MouseEvent} e
     */
    _onMouseDown(e) {
        const {target} = e;

        if (!target || !target.classList || !target.classList.contains(CLASS_CONTROL)) {
            return;
        }

        // init "drag & drop" handlers
        this._domNode.addEventListener('mousemove', this._onMouseMove);
        this._domNode.addEventListener('mouseup', this._onMouseUp);
        this._domNode.addEventListener('mouseleave', this._onMouseUp);

        // prepare drag and drop metadata
        const cell = target.parentNode.__cell;
        const parent = cell.parent ? cell.parent : null;

        const axisY = CONTROL_AXIS_Y.includes(target.__mode);
        const axis = axisY ? 'col' : 'row';
        const coords = {
            x: e.clientX,
            y: e.clientY,
        };

        this._dnd = {
            /* cell */
            cell, // cell meta
            cellBasis: axisY ? cell.node.clientHeight : cell.node.clientWidth, // basis of cell node
            parentBasis: parent ? (axisY ? parent.node.clientHeight : parent.node.clientWidth) : 0,

            /* directon */
            axis, // axis direction
            axisY, // is y axis
            control: target.__mode, // control mod

            /* paren children position */
            position: parent ? parent.children.indexOf(cell) : 0, // index in children array
            lastPosition: parent ? parent.children.length - 1 : 0, // index of last item in children array

            /* coords */
            start: coords, // mouse coords of start position
            end: coords, // mouse coords current or end position
        };
    }

    _onMouseMove(e) {
        // check drag and drop
        if (!this._dnd) {
            return;
        }

        // update mouse movement
        this._dnd.end = {
            x: e.clientX,
            y: e.clientY,
        };

        this._handleDragAndDrop();
    }

    /**
     * ends handling of moves of controls
     *
     * @param {undefined|MouseEvent} e
     */
    _onMouseUp(e) {
        // check drag and drop
        if (!this._dnd) {
            return;
        }

        // clean event handlers
        this._domNode.removeEventListener('mousemove', this._onMouseMove);
        this._domNode.removeEventListener('mouseup', this._onMouseUp);
        this._domNode.removeEventListener('mouseleave', this._onMouseUp);

        // update mouse movement
        if (e) {
            this._dnd.end = {
                x: e.clientX,
                y: e.clientY,
            };
        }

        // finish drag and drop
        this._handleDragAndDrop();
        this._dnd = null;
    }

    /* eslint-disable complexity */
    /**
     * handles movements of controls
     */
    _handleDragAndDrop() {
        const {
            cell,
            cellBasis,
            parentBasis,
            axis,
            axisY,
            control,
            position,
            lastPosition,
            start,
            end,
        } = this._dnd;

        if (!cell) { // prevent handle dnd on removed cell
            return;
        }

        const {
            parent,
        } = cell;

        // current movement delta (mouse coords delta)
        const delta = axisY ? end.y - start.y : end.x - start.x;
        // axis controls
        const axisControls = axisY ? CONTROL_AXIS_Y : CONTROL_AXIS_X;

        if (delta === 0) { // useless optimization
            return;
        }

        // is root cell
        // or check is controls opposite to parent axis for cell
        if (!parent || axis !== parent.direction) {
            // convert cell to tape
            const deltaMod = Math.abs(delta);

            // check min delta
            if (deltaMod < MIN_DELTA) {
                return;
            }

            // calc split percent
            const basis = deltaMod / cellBasis * 100;

            // create child cells
            const targetChild = cell.convertToTape(control, basis);

            // replace drag and drop meta
            this._dnd = {
                cell: targetChild,
                cellBasis: axisY ? targetChild.node.clientHeight : targetChild.node.clientWidth,
                parentBasis: cellBasis,
                axis,
                axisY,
                control,
                position: cell.children.indexOf(targetChild),
                lastPosition: 1, // cell.parent.children.length == 1
                start: end,
                end,
            };

        // check first and last cell on parent axis in attempt to create new cell
        } else if (
            position === 0 && control === axisControls[0] ||
            position === lastPosition && control === axisControls[1]
        ) {
            // convert cell to tape
            const deltaMod = Math.abs(delta);

            // check min delta
            if (deltaMod < MIN_DELTA) {
                return;
            }

            // calc split percent
            const basis = deltaMod / parentBasis * 100;

            // create new cell
            const appendAtStart = control === axisControls[0];
            parent.appendChild(basis, appendAtStart);

            // update drag and drop meta
            this._dnd.cellBasis = axisY ? cell.node.clientHeight : cell.node.clientWidth;
            this._dnd.position = cell.parent.children.indexOf(cell);
            this._dnd.lastPosition = cell.parent.children.length - 1;
            this._dnd.start = end;

        // change size of cell
        } else {
            const firstControl = control === axisControls[0]; // control == top or left

            // get sibling cell
            const siblingIndex = firstControl ? position - 1 : position + 1;
            const sibling = parent.children[siblingIndex];

            // calc basis
            const deltaBasis = delta / parentBasis * 100;

            // change cell size
            if (firstControl) {
                const basis = cellBasis - delta;
                const siblingBasis = (sibling.basis + deltaBasis) * parentBasis / 100;

                // remove cell
                if (basis <= MIN_BASIS) {
                    cell.remove(control);

                    // update drag and drop meta
                    this._dnd.cell = null;

                // remove sibling cell
                } else if (siblingBasis <= MIN_BASIS) {
                    parent.removeChild(sibling, cell);

                    // update drag and drop meta
                    this._dnd.cell = null;

                // change cell size
                } else {
                    cell.basis -= deltaBasis;
                    sibling.basis += deltaBasis;

                    // update drag and drop meta
                    this._dnd.cellBasis = axisY ? cell.node.clientHeight : cell.node.clientWidth;
                    this._dnd.start = end;
                }
            } else {
                const basis = cellBasis + delta;
                const siblingBasis = (sibling.basis - deltaBasis) * parentBasis / 100;

                // remove cell
                if (basis <= MIN_BASIS) {
                    cell.remove(control);

                    // update drag and drop meta
                    this._dnd.cell = null;

                // remove sibling cell
                } else if (siblingBasis <= MIN_BASIS) {
                    parent.removeChild(sibling, cell);

                    // update drag and drop meta
                    this._dnd.cell = null;

                // change cell size
                } else {
                    cell.basis += deltaBasis;
                    sibling.basis -= deltaBasis;

                    // update drag and drop meta
                    this._dnd.cellBasis = axisY ? cell.node.clientHeight : cell.node.clientWidth;
                    this._dnd.start = end;
                }
            }
        }

        // notify others
        mediator.emit('layout:change', this._layout.serialize());
    }
    /* eslint-enable complexity */
}

export default Layout;
