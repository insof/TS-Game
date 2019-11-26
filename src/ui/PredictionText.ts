import Sprite from "../utils/Sprite";
import * as PIXI from "pixi.js";

const textStyle = {
    fill: 0xffffff,
    fontFamily: "Arcade",
    fontSize: 23,
    fontWeight: "bold",
};

export default class PredictionText extends Sprite {

    readonly _predictionText: PIXI.Text;

    constructor() {
        super();
        this._predictionText = new PIXI.Text("", textStyle);
        this._predictionText.anchor.set(0.5);
        this.addChild(this._predictionText);
        this.visible = false;
    }

    public updateText(arr: string[]): void {
        this._predictionText.text = "spin result = " + arr.join(", ");
        this.visible = true;
    }

    public hide(): void {
        this.visible = false;
    }
}