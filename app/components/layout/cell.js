import uuid from 'uuid/v4';

const CLASS_CELL = 'layout__cell';
export const CLASS_CONTROL = 'layout__contol';
const CLASS_TAPE = 'layout__tape';

export const CONTROL_AXIS_X = ['left', 'right'];
export const CONTROL_AXIS_Y = ['top', 'bottom'];
export const CONTROL_TAPE_START = [CONTROL_AXIS_X[0], CONTROL_AXIS_Y[0]];

const DEFAULT_DIRECTION = 'row';


export class Cell {
    /**
     * @constructor
     * @param {Object} [options = {}]
     * @param {string} [options.type = cell]
     * @param {string} [options.uuid]
     * @param {null|Cell} [options.parent = null]
     * @param {string} [options.direction = DEFAULT_DIRECTION]
     * @param {Object[]} [options.children]
     * @param {number} [options.basis = 100]
     * @param {boolean} [options.empty = false]
     * @param {Object} data
     * @param {<string,Object>} data.marks
     * @param {<string,Object>} data.viewer
     */
    constructor(options = {}, data = {}) {
        const {
            type = 'cell',
            uuid: id = uuid(),
            parent = null,
            direction,
            children = [],
            basis = 100,
            empty = false,
        } = options;

        // meta
        this.type = type;
        this.uuid = id;
        this.parent = parent;

        // direction
        if (!parent) { // root node
            this.direction = direction || DEFAULT_DIRECTION;
        } else if (type === 'tape') {
            if (!direction) {
                console.warn('[Cell::constructor] no direction', options); // eslint-disable-line
                debugger; // eslint-disable-line
            }
            this.direction = direction;
        } else { // type === 'cell'
            this.direction = parent.direction;
        }

        // dom node
        this._render(empty);

        // children
        this.children = children.map(child => {
            const cell = new Cell(Object.assign({}, child, {parent: this}), data);
            this.node.appendChild(cell.node);

            return cell;
        });

        // update size (flex basis)
        this.basis = basis;
    }

    /**
     * destructor
     *
     * @param {boolean} [removeFromDOM = true] - small optimization
     */
    _destroy(removeFromDOM = true) {
        // remove children
        this.children.forEach(child => child._destroy(false));
        this.children = null;

        // remove dom
        this.node.__cell = null;
        if (removeFromDOM) {
            this.node.remove();
        }
        this.node = null;

        // cleanup
        this.parent = null;
        this.type = 'removed';
    }

    /**
     * creates and returns cell dom node
     *
     * @param {boolean} [empty = false] - don't add controls to cell
     * @return {HTMLDivElement}
     */
    _render(empty = false) {
        if (this.node) { // cell was created
            return;
        }

        // dom
        const node = document.createElement('div');
        node.classList.add(CLASS_CELL);
        node.classList.add(`${CLASS_CELL}_${this.parent ? this.parent.direction : this.direction}`);
        node.__cell = this;

        // append to cell
        this.node = node;

        // convert to tape
        if (this.type === 'tape') {
            node.classList.add(CLASS_TAPE);
            node.classList.add(`${CLASS_TAPE}_${this.direction}`);

        // add cell controls
        } else if (!empty) {
            this._renderControls();
        }

        return node;
    }

    /**
     * renders cell controls
     */
    _renderControls() {
        ['top', 'right', 'bottom', 'left'].forEach(position => {
            const control = document.createElement('div');
            control.classList.add(CLASS_CONTROL);
            control.classList.add(`${CLASS_CONTROL}_${position}`);
            control.__mode = position;

            this.node.appendChild(control);
        });
    }

    /**
     * removes cell
     *
     * @param {string} [control] - control type, need to decision for which cell to add basis
     */
    remove(control) {
        const {parent} = this;

        if (parent) {
            const {children} = parent;
            const index = children.indexOf(this);
            const lastIndex = children.length - 1;

            if (control) {
                // axis and control position
                const axisControls = CONTROL_AXIS_Y.includes(control) ? CONTROL_AXIS_Y : CONTROL_AXIS_X;
                const firstControl = control === axisControls[0]; // control == top or left

                // get sibling cell
                const siblingIndex = firstControl ? index - 1 : index + 1;
                const sibling = children[siblingIndex];

                // add basis to sibling
                sibling.basis += this.basis;

            } else {
                // add basis to second cell
                if (index === 0) {
                    children[1].basis += this.basis;

                // add basis to next to last cell
                } else if (index === lastIndex) {
                    children[lastIndex - 1].basis += this.basis;

                // split between siblings
                } else {
                    const half = this.basis / 2;
                    children[index - 1].basis += half;
                    children[index + 1].basis += half;
                }
            }

            // removes from parent children
            children.splice(index, 1);

            // check children count
            if (children.length < 2) {
                parent._convertToCell();
            }
        }

        // destroy cell
        this._destroy();
    }

    /**
     * serialize cell
     *
     * @return {Object}
     */
    serialize() {
        /* eslint-disable no-shadow */
        const {type, uuid, children, direction, basis} = this;

        return {
            type,
            uuid,
            children: children.map(child => child.serialize()),
            direction,
            basis,
        };
        /* eslint-enable no-shadow */
    }

    /**
     * restore layout
     *
     * @param {Object} meta
     * @param {string} meta.type
     * @param {Object[]} meta.children
     * @param {string} meta.direction
     * @param {number} meta.basis
     * @param {Object} data
     * @param {<string,Object>} data.marks
     * @param {<string,Object>} data.viewer
     */
    sync({type, children, direction, basis}, data) {
        let skipCheckChildren = false;

        // check type
        if (this.type !== type) {
            if (type === 'tape') {
                // remove children (controls)
                // @todo /!\ alarm how about mark and viewer?
                Array.from(this.node.children).forEach(child => child.remove());

                // add classes
                this.node.classList.add(`${CLASS_TAPE}`);
                this.node.classList.add(`${CLASS_TAPE}_${this.direction}`);

                // add children
                this.children = children.map(child => {
                    const cell = new Cell(Object.assign({}, child, {parent: this}), data);
                    this.node.appendChild(cell.node);

                    return cell;
                });

                // we already create children
                skipCheckChildren = true;

            } else { // type === 'cell'
                // remove children
                this.children.forEach(child => child._destroy());
                this.children = [];

                // remove classes
                this.node.classList.remove(`${CLASS_TAPE}_${this.direction}`);
                this.node.classList.remove(`${CLASS_TAPE}`);

                // add controls
                this._renderControls();
            }

            this.type = type;
        }

        // check direction
        if (this.direction !== direction) {
            // change cell direction
            this.node.classList.remove(`${CLASS_CELL}_${this.direction}`);
            this.node.classList.add(`${CLASS_CELL}_${this.parent ? this.parent.direction : direction}`);

            // change tape direction
            if (type === 'tape') {
                this.node.classList.remove(`${CLASS_TAPE}_${this.direction}`);
                this.node.classList.add(`${CLASS_TAPE}_${direction}`);
            }

            this.direction = direction;
        }

        // check basis
        if (this.basis !== basis) {
            this.basis = basis;
        }

        // check children
        if (!skipCheckChildren) {
            // prepare
            const map = this.children.reduce((memo, child) => {
                memo[child.uuid] = child;
                return memo;
            }, {});
            const processed = [];

            // process children
            this.children = children.map(meta => {
                processed.push(meta.uuid);

                const child = map[meta.uuid] // child exists
                    ? map[meta.uuid].sync(meta, data)
                    : new Cell(Object.assign({}, meta, {parent: this}), data);

                // reorder cells
                this.node.appendChild(child.node);

                return child;
            });

            // remove cells
            /* eslint-disable no-shadow */
            Object.keys(map)
                .filter(uuid => !processed.includes(uuid)) // eslint-disable-line
                .forEach(uuid => map[uuid]._destroy());
            /* eslint-enable no-shadow */
        }

        return this;
    }

    /**
     * converts tape to cell
     */
    _convertToCell() {
        // check type and children count
        if (this.type !== 'tape' || this.children.length > 1) {
            return;
        }

        // source and destination
        const source = this.children[0];

        // change dom
        this.node.classList.remove(`${CLASS_TAPE}_${this.direction}`);
        this.node.classList.remove(CLASS_TAPE);

        // move controls
        Array.from(source.node.children).forEach(child => {
            this.node.appendChild(child);
        });

        // meta
        this.type = 'cell';
        this.direction = this.parent ? this.parent.direction : DEFAULT_DIRECTION;
        this.children = [];

        // removes links and dom
        source._destroy();
    }

    /**
     * converts cell to tape and adds two children cells
     *
     * @param {string} control - control type: top / bottom or left / right (direction of changing)
     * @param {number} [secondBasis = 50] - flex basis of secondary child (according to control type)
     * @return {Cell}
     */
    convertToTape(control, secondBasis = 50) {
        // check type
        if (this.type !== 'cell') {
            return;
        }

        // change type
        this.type = 'tape';

        // change direction
        if (!this.parent) { // root node
            this.direction = CONTROL_AXIS_Y.includes(control) ? 'col' : 'row';
        } else {
            this.direction = this.parent.direction === 'row' ? 'col' : 'row';
        }

        // target child to move controls from cell
        const targetIndex = CONTROL_TAPE_START.includes(control) ? 1 : 0;
        const childrenBasis = targetIndex > 0
            ? [secondBasis, 100 - secondBasis]
            : [100 - secondBasis, secondBasis];

        // create children
        const children = childrenBasis.map((basis, index) => {
            const child = new Cell({
                parent: this,
                basis,
                empty: index === targetIndex, // should be empty
            });
            this.children.push(child);

            return child;
        });

        // change dom
        this.node.classList.add(CLASS_TAPE);
        this.node.classList.add(`${CLASS_TAPE}_${this.direction}`);

        // move contols to child
        const target = children[targetIndex];
        Array.from(this.node.children).forEach(child => {
            target.node.appendChild(child);
        });

        // add children to dom
        const df = document.createDocumentFragment();
        children.forEach(child => df.appendChild(child.node));
        this.node.appendChild(df);

        // return refreshed cell (target node)
        return target;
    }

    /**
     * return cell flex basis
     *
     * @return {number}
     */
    get basis() {
        return this._basis;
    }

    /**
     * sets cell flex basis
     *
     * @param {number} value
     */
    set basis(value) {
        if (value < 0) {
            this._basis = 0;

        } else if (value > 100) {
            this._basis = 100;

        } else {
            this._basis = value;
        }

        this.node.style.flexBasis = `${this._basis}%`;
    }

    /**
     * append new cell to tape
     *
     * @param {number} basis
     * @param {boolean} appendAtStart - should append cell at start of tape
     */
    appendChild(basis, appendAtStart) {
        // check type
        if (this.type !== 'tape') {
            return;
        }

        // create child
        const child = new Cell({
            parent: this,
            basis,
        });
        let sibling;

        if (appendAtStart) {
            // get sibling
            sibling = this.children[0];

            // add child to cell
            this.children.unshift(child);

            // add child to dom
            this.node.insertBefore(child.node, this.node.children[0]);
        } else {
            // get sibling
            sibling = this.children[this.children.length - 1];

            // add child to cell
            this.children.push(child);

            // add child to dom
            this.node.appendChild(child.node);
        }

        // change basis sibling child
        sibling.basis -= basis;

        // return new child
        return child;
    }

    /**
     * remove child cell and adds basis to target
     *
     * @param {Cell} cell - removed cell
     * @param {Cell} target - sibling cell
     */
    removeChild(cell, target) {
        const {children} = this;

        // removes from parent children
        const index = children.indexOf(cell);

        if (index < 0) { // just in case
            return;
        }

        // add basis to sibling
        target.basis += cell.basis;

        // destroy
        children.splice(index, 1);
        cell._destroy();

        // check children count
        if (children.length < 2) {
            this._convertToCell();
        }
    }
}

export default Cell;
