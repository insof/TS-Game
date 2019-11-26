import * as PIXI from 'pixi.js';
import Sprite from '../utils/Sprite';
import Audio from '../media/Audio';
import PlayButton from '../ui/PlayButton';
import Slots from './engine/Slots';
import Balance from "./engine/Balance";
import Bet from "./engine/Bet";
import Tile from "./engine/Tile";
import {CONFIG} from "../config/config";
import {ParticleExplosion} from "./effects/ParticleExplosion";
import {KEY_CODES} from "../config/keyCodes";
import {Tween, Easing} from '@tweenjs/tween.js';

/**
 * The main game class, entrance point
 *
 * @class Game
 * @extends PIXI.Sprite
 */

export interface ISlotsConfig {
    background: any,
    foreground: any,
    visibleRows: number,
    xPeriod: number,
    yPeriod: number,
    offsetX: number,
    offsetY: number,
    margin: number,
    tileScale: number,
    showMask: boolean,
    speed: number,
    startEndSpeedMultiplier: number,
    preRollTiles: number,
    postRollTiles: number
}

export class Game extends Sprite {
    private _playButton: PlayButton;
    private _slots: Slots;
    private _balanceElement: Balance;
    private _betElement: Bet;
    private _winText: PIXI.Text;
    private _predictionText: PIXI.Text;
    private _shader: PIXI.Graphics;
    private _rotateImage: Sprite;
    private _back: Sprite;
    private _winTextCont: Sprite;
    private _explodes: ParticleExplosion[] = [];

    static initAudio(): void {
        Audio.init();
        Audio.playMusic();
    }

    constructor() {
        super();
        Game.initAudio();
        this._initView();
        this._initListeners();
    }

    public tick(delta: number): void {
        this._tickExplodes(delta);
    }

    public onResize(w: number, h: number): void {
        if (w > h) {
            if (this._predictionText) this._predictionText.visible = false;
            this._shader.clear();
            this._shader.beginFill(0x555555, 1);
            this._shader.drawRect(-w / 2, -h / 2, w, h);
            this._shader.endFill();
            this._shader.visible = true;
            this._rotateImage.visible = true;
            this._rotateImage.height = h;
            this._rotateImage.scale.x = this._rotateImage.scale.y;
        } else {
            this._shader.visible = false;
            if (this._predictionText) this._predictionText.visible = true;
            this._rotateImage.visible = false;
            this._back.height = h;
            this._back.scale.x = this._back.scale.y;
            this._slots.position.set(0, -100);
            this._winTextCont.position.set(0, this._slots.y);
            this._playButton.position.set(0, 230);
            this._balanceElement.position.set(0, this._playButton.y - this._playButton.height / 2 - this._balanceElement.height / 2 - 20);
            this._betElement.position.set(0, this._playButton.y + this._playButton.height / 2 + this._betElement.height / 2 + 20);
        }
    }

    //tick explodes emitters and clear completed explode animations
    private _tickExplodes(delta: number): void {
        for (let i = 0; i < this._explodes.length; i++) {
            this._explodes[i].tick(delta);
        }
    }

    private _addExplode(x: number, y: number, scale: any): void {
        const explode = this.addChildAt(new ParticleExplosion(), 4);
        explode.position.set(x, y);
        explode.scale.set(scale.x, scale.y);
        this._explodes.push(explode);
    }

    //add buttons and keyboard listeners
    private _initListeners(): void {
        document.addEventListener('keydown', e => this._onKeyDown(e));
    }

    private _onKeyDown(e: any): void {
        if (e.keyCode === KEY_CODES.SPACE) this._spinRandom();
    }

    private _initView(): void {
        this._addBack();
        this._addSlots();
        this._addBalanceElement();
        this._addBetElement();
        this._addWinText(0);
        this._addPlayButton();

        this._shader = this.addChild(new PIXI.Graphics());
        this._shader.visible = false;
        this._shader.interactive = true;

        this._rotateImage = this._shader.addChild(new Sprite("rotate"));

        // ACTIVATION
        this._chargeSpin();
    }


    private _addSlots(): void {
        const config: ISlotsConfig = {
            background: "reel",
            foreground: null,
            visibleRows: 3,
            xPeriod: 130,
            yPeriod: 130,
            offsetX: 0,
            offsetY: 0,
            margin: 2,
            tileScale: 1,
            showMask: false,
            speed: 5,
            startEndSpeedMultiplier: 8,
            preRollTiles: 0.5,
            postRollTiles: 0.5
        };

        const elements = ['sym1', 'sym2', 'sym3', 'sym3', 'sym4', 'sym4', 'sym1', 'sym1', 'sym1', 'sym4', 'sym4',
            'sym4', 'sym4', 'sym2', 'sym1', 'sym1', 'sym3', 'sym1', 'sym1', 'sym5', 'sym5', 'sym5', 'sym2', 'sym2',
            'sym1', 'sym3', 'sym5', 'sym1', 'sym1', 'sym1', 'sym5', 'sym5', 'sym4', 'sym3', 'sym2', 'sym1', 'sym1'];

        this._slots = this.addChild(Slots.fromArray(elements, 1, config, []));

        // SIDE MARKERS

        let marker = new PIXI.Graphics()
            .beginFill(0xff5500)
            .drawRect(-20, -5, 40, 10)
            .endFill();
        marker = this._slots.addChild(marker.clone());
        marker.x -= 130;
        marker = this._slots.addChild(marker.clone());
        marker.x += 130;
    }

    private _addBack(): void {
        this._back = this.addChild(new Sprite("background"));
    }

    private _addPlayButton(): void {
        this._playButton = this.addChild(new PlayButton(this._balanceElement.balance, this._betElement.bet));
        this._playButton.scale.set(0.7, 0.7);
    }

    private _addBalanceElement(): void {
        this._balanceElement = this.addChild(new Balance());
        this._balanceElement.scale.set(0.8);
        this._balanceElement.on("balanceChange", (newBalance: number) => {
                this._playButton._updateButton(newBalance, this._betElement.bet);
            }
        );
    }

    private _addWinText(value: number): void {
        const newText = 'YOU WIN: ' + value + "$";
        if (this._winText) {
            this._winText.text = newText;
        } else {
            this._winTextCont = this.addChild(new Sprite());
            this._winText = new PIXI.Text(newText, {
                fill: ["#ff0000", "#00ff00"],
                fontFamily: 'Arcade',
                fontSize: 60,
                fontWeight: 'bold',
            });
            this._winText.anchor.set(0.5);
            this._winTextCont.addChild(this._winText);
            this._winTextCont.alpha = 0;
        }
    }

    private _addBetElement(): void {
        this._betElement = this.addChild(new Bet());
        this._betElement.scale.set(0.7);
        this._betElement.on("betChange", (newBet: number) => {
                this._playButton._updateButton(this._balanceElement.balance, newBet);
            }
        );
    }

    private _showMatch(data: any): void {
        this._explodes = [];
        const xBorder = CONFIG.APP_WIDTH / 2;
        this._addExplode(xBorder + 50, 0, {x: 1, y: 1});
        this._addExplode(-xBorder - 50, 0, {x: -1, y: 1});


        let row = [],
            type, tile,
            matchTiles = [],
            tempMatchTiles = [],
            i, j, tileType;

        for (let j = 0; j < 3; j++) {
            row.push(data.tilesMap[0][j]);
        }

        for (i = 0; i < row.length; i++) {
            type = row[i].type;
            tempMatchTiles = [];
            for (j = 0; j < row.length; j++) {
                tileType = row[j].type;
                if (type === tileType) {
                    tempMatchTiles.push(row[j]);
                }
            }
            if (tempMatchTiles.length >= 2) {
                matchTiles = tempMatchTiles;
            }
        }

        if (matchTiles.length >= row.length - 1) {
            const winAmmount = this._betElement.bet * matchTiles.length;
            this._addWinText(winAmmount);
            this._winTextCont.alpha = 1;
            this._winTextCont.fadeTo(0, 3500);
            this._balanceElement.updateBalance(winAmmount);

            // MATCH ANIMATION
            for (let i = 0; i < matchTiles.length; i++) {
                tile = matchTiles[i];
                tile.showWinBack();
                tile.winTween = new Tween(tile.winBack)
                    .to({alpha: 0.5}, 300)
                    .repeat(Infinity)
                    .easing(Easing.Elastic.InOut)
                    .yoyo(true)
                    .start();
            }
        } else {
            this._addWinText(0);
        }
    }

    private _balanceUpdate(value: number): void {
        this._balanceElement.updateBalance(value);
    }

    private _chargeSpin(): void {
        this._betElement.unblock();
        this._playButton.spinBlock = false;
        this._playButton.once("spin", this._spinRandom, this);
        this._playButton.once("balanceUpdate", this._balanceUpdate, this);
        this._slots.once('finish', this._showMatch, this);
        this._slots.once('finish', this._chargeSpin, this);
        this._slots.once('predictedResult', this._computePredictedResult, this);
    }

    private _computePredictedResult(data: any): void {
        let row = [],
            type,
            matchTiles = [],
            tempMatchTiles = [],
            i, j, tileType;

        for (let j = 0; j < 3; j++) {
            row.push(data.tilesMap[0][j]);
        }

        console.log("predicted spin result = " + row);
        this._showPrediction(row);

        for (i = 0; i < row.length; i++) {
            type = row[i];
            tempMatchTiles = [];
            for (j = 0; j < row.length; j++) {
                tileType = row[j];
                if (type === tileType) {
                    tempMatchTiles.push(tileType);
                }
            }
            if (tempMatchTiles.length >= 2) {
                matchTiles = tempMatchTiles;
            }
        }

        if (matchTiles.length >= row.length - 1) {
            console.log("SPIN WILL BE WINNING! x" + matchTiles.length);
            console.log("predicted win result = " + matchTiles);
        }
    }

    private _showPrediction(arr: string[]): void {
        let text = 'spin result = ' + arr.join(", ");
        if (this._predictionText) {
            this._predictionText.text = text;
        } else {
            this._predictionText = new PIXI.Text(text, {
                fill: 0xffffff,
                fontFamily: 'Arcade',
                fontSize: 26,
                fontWeight: 'bold',
            });
            this._predictionText.anchor.set(0.5);
            this.addChild(this._predictionText);
            this._predictionText.y = -330;
        }
    }

    private _spinRandom(): void {
        if (this._playButton.spinBlock) return;
        this._playButton.spinBlock = true;
        this._winTextCont.alpha = 0;
        this._betElement.block();
        // STOP TWEENS
        this._slots.tilesMap.forEach((reel: Tile[]) => {
            for (let i = 0; i < reel.length; i++) {
                if (reel[i].winTween) {
                    reel[i].winTween.stop();
                    reel[i].hideWinBack();
                    reel[i].winTween = null;
                }
            }
        });

        const spinTiles: number[] = [+(100 + Math.random() * 19)];

        this._slots.rollBy(spinTiles);
    }
}
