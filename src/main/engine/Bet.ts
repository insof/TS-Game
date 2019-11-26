import Sprite from "../../utils/Sprite";
import {EVENTS} from "../../config/events";

const textStyle = {
    fill: 0xffffff,
    fontFamily: "Arcade",
    fontSize: 36,
    fontWeight: "bold",
};

export default class Bet extends Sprite {

    private _blocked: boolean;
    private _betPrice: number;
    private _betText: PIXI.Text;

    constructor() {
        super();

        this.bet = 1;
        this._blocked = false;
        this.addBetText();

        this.createButton("plus", 200, this.increaseBet);
        this.createButton("minus", -200, this.decreaseBet);
    }

    set bet(value: number) {
        this._betPrice = value;
        this.emit(EVENTS.GAME.BET_CHANGE, this.bet);
        this.addBetText();
    }

    get bet(): number {
        return this._betPrice;
    }

    public block(): void {
        this._blocked = true;
    }

    public unblock(): void {
        this._blocked = false;
    }

    private createButton(name:string, x:number, callback:Function): Sprite {
        const obj = this.addChild(new Sprite(name));
        obj.scale.set(0.4);
        obj.anchor.set(0.5);
        obj.x = x;
        obj.interactive = true;
        obj.buttonMode = true;
        obj.on("pointerdown", callback, this);
        return obj;
    }

    private increaseBet(): void {
        if (this._blocked) return;
        this.bet = this.bet + 1;
    }

    private decreaseBet(): void {
        if (this._blocked) return;
        if ((this.bet - 1) > 0) this.bet = this.bet - 1;
    }

    private addBetText(): void {
        let newText = "Current bet: " + this.bet + "$";
        if (this._betText) {
            this._betText.text = newText;
        } else {
            this._betText = new PIXI.Text(newText, textStyle);
            this._betText.anchor.set(0.5);
            this.addChild(this._betText);
            this._betText.y += 5;
        }
    }
}