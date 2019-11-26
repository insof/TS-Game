import * as PIXI from "pixi.js";
import Sprite from "../utils/Sprite";
import Audio from "../media/Audio";
import PlayButton from "../ui/PlayButton";
import Slots from "./engine/Slots";
import Balance from "./engine/Balance";
import Bet from "./engine/Bet";
import Tile from "./engine/Tile";
import {CONFIG} from "../config/config";
import {ParticleExplosion} from "./effects/ParticleExplosion";
import {KEY_CODES} from "../config/keyCodes";
import {ISlotsConfig} from "./engine/interfaces/ISlotsConfig";
import {EVENTS} from "../config/events";
import WinText from "../ui/WinText";
import PredictionText from "../ui/PredictionText";

/**
 * The main game class, entrance point
 *
 * @class Game
 * @extends PIXI.Sprite
 */


export class Game extends Sprite {
    private _playButton: PlayButton;
    private _slots: Slots;
    private _balanceElement: Balance;
    private _betElement: Bet;
    private _predictionText: PredictionText;
    private _shader: PIXI.Graphics;
    private _rotateImage: Sprite;
    private _back: Sprite;
    private _winTextCont: WinText;
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
        this._predictionText.hide();
        if (w > h) {
            this._redrawShader(w, h);
            this._shader.visible = true;
            this._rotateImage.visible = true;
            this._rotateImage.height = h;
            this._rotateImage.scale.x = this._rotateImage.scale.y;
        } else {
            this._shader.visible = false;

            this._rotateImage.visible = false;
            this._back.height = h;
            this._back.scale.x = this._back.scale.y;
            let sH: number = (h / 2) * ((h / 2) / this._slots.background.height) / this._slots.background.height;
            if (Math.max(w / h, h / w) > 2) sH = 0.7;
            if (sH > 1) sH = 1;

            this._slots.scale.set(sH);
            this._slots.position.set(0, -h / 4);
            this._predictionText.position.set(0, -h/2+15);
            this._winTextCont.scale.set(sH);
            this._winTextCont.position.set(0, this._slots.y);
            this._playButton.scale.set(sH);
            this._playButton.position.set(0, h / 4);
            this._balanceElement.scale.set(sH);
            this._balanceElement.position.set(0, this._playButton.y - this._playButton.height / 2 - this._balanceElement.height / 2 - 20);
            this._betElement.scale.set(sH);
            this._betElement.position.set(0, this._playButton.y + this._playButton.height / 2 + this._betElement.height / 2 + 20);

        }
    }

    private _redrawShader(w: number, h: number): void {
        this._shader.clear();
        this._shader.beginFill(0x555555, 1);
        this._shader.drawRect(-w / 2, -h / 2, w, h);
        this._shader.endFill();
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
        document.addEventListener("keydown", e => this._onKeyDown(e));
    }

    private _onKeyDown(e: any): void {
        if (e.keyCode === KEY_CODES.SPACE) this._spinRandom();
    }

    private _initView(): void {
        this._addBack();
        this._addSlots();
        this._addBalanceElement();
        this._addBetElement();
        this._addWinText();
        this._addPlayButton();
        this._addPredictionText();

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

        this._slots = this.addChild(Slots.fromArray(CONFIG.REEL_CONFIG, 1, config, []));

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
        this._balanceElement.on(EVENTS.GAME.BALANCE_CHANGE, (newBalance: number) => {
                this._playButton._updateButton(newBalance, this._betElement.bet);
            }
        );
    }

    private _addWinText(): void {
        this._winTextCont = this.addChild(new WinText());
    }

    private _addBetElement(): void {
        this._betElement = this.addChild(new Bet());
        this._betElement.scale.set(0.7);
        this._betElement.on(EVENTS.GAME.BET_CHANGE, (newBet: number) => {
                this._playButton._updateButton(this._balanceElement.balance, newBet);
            }
        );
    }

    private _showMatch(data: any): void {
        this._explodes = [];
        const xBorder = CONFIG.APP_WIDTH / 2;
        this._addExplode(xBorder + 50, 0, {x: 1, y: 1});
        this._addExplode(-xBorder - 50, 0, {x: -1, y: 1});
        Audio.playSound("yay");

        let row = [], type, matchTiles = [], tempMatchTiles = [], tileType;
        for (let j = 0; j < 3; j++) {
            row.push(data.tilesMap[0][j]);
        }

        for (let i = 0; i < row.length; i++) {
            type = row[i].type;
            tempMatchTiles = [];
            for (let j = 0; j < row.length; j++) {
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
            this._showWin(matchTiles);
        }
    }

    private _showWin(matchTiles: Tile[]): void {
        const winAmmount = this._betElement.bet * matchTiles.length;
        this._winTextCont.updateText(winAmmount);
        this._balanceElement.updateBalance(winAmmount);

        // MATCH ANIMATION
        for (let i = 0; i < matchTiles.length; i++) {
            matchTiles[i].showWinBack();
        }
    }

    private _balanceUpdate(value: number): void {
        this._balanceElement.updateBalance(value);
    }

    private _chargeSpin(): void {
        this._betElement.unblock();
        this._playButton.spinBlock = false;
        this._playButton.once(EVENTS.GAME.SPIN, this._spinRandom, this);
        this._playButton.once(EVENTS.GAME.BALANCE_UPDATE, this._balanceUpdate, this);
        this._slots.once(EVENTS.SLOTS.SPIN_END, this._showMatch, this);
        this._slots.once(EVENTS.SLOTS.SPIN_END, this._chargeSpin, this);
        this._slots.once(EVENTS.SLOTS.PREDICTION_RESULT, this._computePredictedResult, this);
    }

    private _computePredictedResult(data: any): void {
        let row = [], type, matchTiles = [], tempMatchTiles = [], tileType;

        for (let j = 0; j < 3; j++) {
            row.push(data.tilesMap[0][j]);
        }

        console.log("predicted spin result = " + row);
        this._predictionText.updateText(row);

        for (let i = 0; i < row.length; i++) {
            type = row[i];
            tempMatchTiles = [];
            for (let j = 0; j < row.length; j++) {
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

    private _addPredictionText(): void {
        this._predictionText = this.addChild(new PredictionText());
    }

    private _spinRandom(): void {
        if (this._playButton.spinBlock) return;
        this._playButton.spinBlock = true;
        this._winTextCont.hide();
        this._betElement.block();
        // STOP TWEENS
        this._slots.tilesMap.forEach((reel: Tile[]) => {
            for (let i = 0; i < reel.length; i++) {
                reel[i].hideWinBack();
            }
        });

        const spinTiles: number[] = [+(100 + Math.random() * 19)];

        this._slots.rollBy(spinTiles);
    }
}
