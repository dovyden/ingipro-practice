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
     *
     * @param {null|Cell} [parent = null] - parent uuid
     * @param {number} [basis = 100] - cell flex basis
     * @param {boolean} [empty = false] - don't add controls
     * @param {boolean|string} customUuid - custom uuid
     */
    constructor(parent, basis, empty = false, customUuid = false) {
        this.type = 'cell';
        this.uuid = customUuid || uuid();
        this.parent = parent || null;
        this.direction = parent ? parent.direction : DEFAULT_DIRECTION;
        this.node = this._render(empty);
        this.children = [];
        this.basis = basis || 100;
    }

    /**
     * creates and returns cell dom node
     *
     * @param {boolean} empty - don't add controls
     * @return {HTMLDivElement}
     */
    _render(empty) {
        if (this.node) { // cell was created
            return;
        }

        // dom
        const node = document.createElement('div');
        node.classList.add(CLASS_CELL);
        node.classList.add(`${CLASS_CELL}_${this.direction}`);
        node.__cell = this;

        // controls
        if (!empty) {
            ['top', 'right', 'bottom', 'left'].forEach(position => {
                const control = document.createElement('div');
                control.classList.add(CLASS_CONTROL);
                control.classList.add(`${CLASS_CONTROL}_${position}`);
                control.__mode = position;

                node.appendChild(control);
            });
        }

        return node;
    }

    /**
     * destructor
     */
    destroy() {
        // remove children
        this.children.forEach(child => child.destroy());
        this.children = null;

        // remove dom
        this.node.__cell = null;
        this.node.remove();
        this.node = null;

        // cleanup
        this.parent = null;
        this.type = 'removed';
    }

    /**
     * removes cell from layout
     *
     * @param {string} control
     */
    remove(control) {
        const {parent} = this;

        if (!parent) {
            return;
        }

        const {children} = parent;

        // axis and control position
        const axisControls = CONTROL_AXIS_Y.includes(control) ? CONTROL_AXIS_Y : CONTROL_AXIS_X;
        const firstControl = control === axisControls[0]; // control == top or left

        // get sibling cell
        const index = children.indexOf(this);
        const siblingIndex = firstControl ? index - 1 : index + 1;
        const sibling = children[siblingIndex];

        // removes from parent children
        children.splice(index, 1);

        // destroy
        this.destroy();

        // add basis to sibling
        sibling.basis += this.basis;

        // check children count
        if (children.length < 2) {
            parent._convertToCell();
        }
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
     * converts cell to tape and adds two children cells
     *
     * @param {string} control - control type: top / bottom or left / right (direction of changing)
     * @param {number} deltaPercent - flex basis of secondary child (according to control type)
     * @return {Cell}
     */
    convertToTape(control, deltaPercent) {
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
            ? [deltaPercent, 100 - deltaPercent]
            : [100 - deltaPercent, deltaPercent];

        // create children
        const children = childrenBasis.map((basis, index) => {
            const shouldBeEmpty = index === targetIndex;
            const child = new Cell(this, basis, shouldBeEmpty);

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
        const child = new Cell(this, basis);
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
        children.splice(index, 1);

        // destroy
        cell.destroy();

        // add basis to sibling
        target.basis += cell.basis;

        // check children count
        if (children.length < 2) {
            this._convertToCell();
        }
    }

    /**
     * converts tape to cell (call by child for parent)
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
        source.destroy();

        return this;
    }
}

export default Cell;
