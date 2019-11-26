import Sprite from "../../utils/Sprite";
import Tween = TWEEN.Tween;

export default class Tile extends Sprite {

    public zIndex: number;
    public winTween: Tween;

    readonly type: string;
    readonly winBack: Sprite;
    readonly front: Sprite;

    public static create(frameName: string): Tile {
        return new Tile(frameName, frameName);
    }

    constructor(frame: string, type: string) {
        super();

        this.winBack = this.addChild(new Sprite("win_bg"));
        this.front = this.addChild(new Sprite(frame));
        this.hideWinBack();
        this.type = type;
        this.zIndex = 100;
    }

    public showWinBack(): void {
        this.winBack.alpha = 1;
    }

    public hideWinBack(): void {
        this.winBack.alpha = 0;
    }
}