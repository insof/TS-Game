import Sprite from "../utils/Sprite";
import * as PIXI from "pixi.js";

export const _textStyle = {
    fill: ["#ff0000", "#00ff00"],
    fontFamily: "Arcade",
    fontSize: 60,
    fontWeight: "bold",
};

export default class WinText extends Sprite {

    readonly _winText: PIXI.Text;

    constructor() {
        super();
        this._winText = new PIXI.Text("", _textStyle);
        this._winText.anchor.set(0.5);
        this.addChild(this._winText);
        this.alpha = 0;
    }

    public updateText(value: number): void {
        this._winText.text = "YOU WIN: " + value + "$";
        this.fade();
    }

    public hide(): void {
        this.alpha = 0;
    }

    private fade(): void {
        this.alpha = 1;
        this.fadeTo(0, 3500);
    }
}