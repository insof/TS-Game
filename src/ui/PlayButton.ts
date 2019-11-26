import Sprite from '../utils/Sprite';
// import {Easing, Tween} from '@tweenjs/tween.js';
import Audio from '../media/Audio';
import {EVENTS} from "../config/events";

/**
 * Play Button - just animated button to start play
 *
 * @class PlayButton
 * @extends Sprite
 */

export default class PlayButton extends Sprite {
    public active: boolean;
    public spinBlock: boolean;

    readonly activeTexture: PIXI.Texture;
    readonly inactiveTexture: PIXI.Texture;
    private currentBet: number;

    constructor(balance: number, bet: number) {
        super();
        this.interactive = true;
        this.buttonMode = true;
        this.activeTexture = PIXI.Texture.from("play_active");
        this.inactiveTexture = PIXI.Texture.from("play_disabled");
        this.active = false;
        this.spinning = false;

        this._updateButton(balance, bet);

        this.on("pointerdown", this._onAction, this);
    }

    set spinning(value:boolean) {
        this.spinBlock = value;
    }

    get spinning(): boolean {
        return this.spinBlock;
    }

    public _updateButton(balance: number, bet: number): void {
        this.currentBet = bet;
        if ((balance - bet) >= 0) {
            this.texture = this.activeTexture;
            this.active = true;
        } else {
            this.texture = this.inactiveTexture;
            this.active = false;
        }
    }

    private _onAction(): void {
        if (!this.active || this.spinning) return;
        Audio.playSound("button");
        this.emit(EVENTS.GAME.SPIN);
        this.emit(EVENTS.GAME.BALANCE_UPDATE, -this.currentBet);
    }
}
