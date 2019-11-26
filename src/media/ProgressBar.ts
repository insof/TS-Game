import Sprite from '../utils/Sprite';

/**
 * Progress Bar, indicates load progress
 *
 * @class ProgressBar
 * @extends Sprite
 */

export default class ProgressBar extends Sprite {
    private readonly _maxWidth: number;

    constructor() {
        super("progress_line");

        this._maxWidth = this.width;
        this.width = 0;
        this.position.set(0, 100);
    }

    public update(progress: number): void {
        this.width = progress * this._maxWidth / 100;
        this.x = -this._maxWidth / 2 + this.width / 2;
    }
}
