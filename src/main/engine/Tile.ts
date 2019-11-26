import Sprite from "../../utils/Sprite";
import {Tween, Easing} from "@tweenjs/tween.js";

export class Tile extends Sprite {

    public zIndex: number;
    public winTween: Tween;

    public readonly type: string;

    private readonly _winBack: Sprite;

    public static create(frameName: string): Tile {
        return new Tile(frameName, frameName);
    }

    constructor(frame: string, type: string) {
        super();

        this._winBack = this.addChild(new Sprite("win_bg"));
        this.addChild(new Sprite(frame));
        this.hideWinBack();
        this.type = type;
        this.zIndex = 100;
    }

    public showWinBack(): void {
        this._winBack.alpha = 1;
        this.winTween = new Tween(this._winBack)
            .to({alpha: 0.5}, 300)
            .repeat(Infinity)
            .easing(Easing.Elastic.InOut)
            .yoyo(true)
            .start();
    }

    public hideWinBack(): void {
        this._winBack.alpha = 0;
        if (this.winTween) {
            this.winTween.stop();
            this.winTween = null;
        }
    }
}