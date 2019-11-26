import Sprite from "../../utils/Sprite";

export default class Balance extends Sprite {

    private balText: PIXI.Text;
    private CURRENT_BALANCE: number;

    constructor() {
        super();
        this.balance = 100;
        this.addBalanceText();
    }

    public updateBalance(diff: number): void {
        this.balance += diff;
        this.addBalanceText();
    }

    get balance(): number {
        return this.CURRENT_BALANCE;
    }

    set balance(value: number) {
        this.CURRENT_BALANCE = value;
        this.emit("balanceChange", this.balance);
    }

    private addBalanceText(): void {
        let newText = 'Current balance: ' + this.balance + "$";
        if (this.balText) {
            this.balText.text = newText;
        } else {
            this.balText = new PIXI.Text(newText, {
                fill: 0xffffff,
                fontFamily: 'Arcade',
                fontSize: 44,
                fontWeight: 'bold',
            });
            this.balText.anchor.set(0.5);
            this.addChild(this.balText);
        }
    }
}