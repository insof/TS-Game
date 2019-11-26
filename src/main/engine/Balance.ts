import Sprite from "../../utils/Sprite";
import {CONFIG} from "../../config/config";
import {EVENTS} from "../../config/events";

export const _textStyle = {
    fill: 0xffffff,
    fontFamily: "Arcade",
    fontSize: 44,
    fontWeight: "bold",
};

export default class Balance extends Sprite {

    private _balText: PIXI.Text;
    private _currentBalance: number;

    constructor() {
        super();
        this.balance = CONFIG.START_BALANCE;
        this.addBalanceText();
    }

    public updateBalance(diff: number): void {
        this.balance += diff;
        this.addBalanceText();
    }

    get balance(): number {
        return this._currentBalance;
    }

    set balance(value: number) {
        this._currentBalance = value;
        this.emit(EVENTS.GAME.BALANCE_CHANGE, this.balance);
    }

    private addBalanceText(): void {
        let newText = "Current balance: " + this.balance + "$";
        if (this._balText) {
            this._balText.text = newText;
        } else {
            this._balText = new PIXI.Text(newText, _textStyle);
            this._balText.anchor.set(0.5);
            this.addChild(this._balText);
        }
    }
}