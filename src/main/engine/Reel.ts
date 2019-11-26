import {ISlotsConfig} from "./interfaces/ISlotsConfig";
import Tile from "./Tile";
import Sprite from "../../utils/Sprite";
import { Tween, Easing } from "@tweenjs/tween.js";
import {EVENTS} from "../../config/events";

export interface IReelTweenConfig {
    to: number,
    time: number,
    ease?: any,
    onUpdate?: any,
    onStart?: any,
    onComplete?: any
}

export default class Reel extends Sprite {

    public rolling: boolean;
    public preRolling: boolean;
    public postRolling: boolean;
    public finished: boolean;

    readonly config: ISlotsConfig;
    readonly reelNumber: number;
    readonly tiles: Tile[];
    readonly _maxYposition: number;

    private _startPositions: number[];
    private _distance: number;
    private _tilesToRoll: number;

    private static createRollTween(config: IReelTweenConfig): Tween {
        const {to, time, ease, onStart, onUpdate, onComplete} = config;
        const tween = new Tween({tilesToRoll: 0}).to({tilesToRoll: to}, time);
        if (ease) tween.easing(ease);
        if (onStart) tween.onStart(onStart);
        if (onUpdate) tween.onUpdate(onUpdate);
        if (onComplete) tween.onComplete(onComplete);

        return tween;
    }

    constructor(reelNumber: number, reelTiles: Tile[], maskPolygon: number[], config: ISlotsConfig) {
        super();
        this.config = config;
        // CONFIG DEFAULTS
        this.reelNumber = reelNumber;

        this._startPositions = [];
        this._distance = 0;

        this.rolling = false;
        this.preRolling = false;
        this.postRolling = false;
        this.finished = false;

        this.tiles = [];
        let tile = null;
        for (let f = 0; f < reelTiles.length; f++) {
            tile = reelTiles[f];
            tile.y = f * this.config.yPeriod;
            tile.scale.set(this.config.tileScale);
            this.addChild(tile);
            this.tiles.push(tile);
        }

        this._maxYposition = this.config.yPeriod * (this.tiles.length - 1);

        this.addMask(maskPolygon);
        this.rearrangeReel();

        this.updatezOrder();
        this.visibilityCheck();

        // ROLLING BINDS
        this.setStartPositions = this.setStartPositions.bind(this);
        this.onPreRollStart = this.onPreRollStart.bind(this);
        this.onRollStart = this.onRollStart.bind(this);
        this.onPostRollStart = this.onPostRollStart.bind(this);
        this.onRollUpdate = this.onRollUpdate.bind(this);
        this.onPostRollFinish = this.onPostRollFinish.bind(this);
    }

    public roll(distanceTiles: number): void {
        this._tilesToRoll = distanceTiles;
        this.preRoll(); // start of tween chain
    }

    private preRoll(): void {
        // PRE-ROLL TWEEN
        let preRollTimeUp = this.config.yPeriod * this.config.preRollTiles / this.config.speed * this.config.startEndSpeedMultiplier;
        let preRollTimeDown = this.config.yPeriod * this.config.preRollTiles / this.config.speed * this.config.startEndSpeedMultiplier / 4;

        const tweenUpConfig: IReelTweenConfig = {
            to: -this.config.preRollTiles,
            time: preRollTimeUp,
            ease: Easing.Quadratic.Out,
            onStart: this.onPreRollStart,
            onUpdate: this.onRollUpdate
        };
        let preRollTweenUp = Reel.createRollTween(tweenUpConfig);

        const tweenDownConfig: IReelTweenConfig = {
            to: this.config.preRollTiles,
            time: preRollTimeDown,
            ease: Easing.Quadratic.In,
            onStart: this.setStartPositions,
            onUpdate: this.onRollUpdate,
            onComplete: this.mainRoll.bind(this)
        };
        let preRollTweenDown = Reel.createRollTween(tweenDownConfig);

        preRollTweenUp.chain(preRollTweenDown);
        preRollTweenUp.start();
    }

    private mainRoll(): void {
        // ROLLING TWEEN
        this._tilesToRoll = (this._tilesToRoll >= 0) ? this._tilesToRoll : 0;
        this._distance = this._tilesToRoll * this.config.yPeriod;
        const rollTime = this._distance / this.config.speed;

        const tweenMainConfig: IReelTweenConfig = {
            to: this._tilesToRoll,
            time: rollTime,
            ease: null,
            onStart: this.onRollStart,
            onUpdate: this.onRollUpdate,
            onComplete: this.postRoll.bind(this)
        };
        let mainRollTween = Reel.createRollTween(tweenMainConfig);

        mainRollTween.start();
    }

    private postRoll(): void {
        // POST-ROLL TWEENS
        let postRollTimeDown = this.config.yPeriod * this.config.postRollTiles / this.config.speed * this.config.startEndSpeedMultiplier;
        let postRollTimeUp = this.config.yPeriod * this.config.postRollTiles / this.config.speed * this.config.startEndSpeedMultiplier / 4;

        const tweenDownConfig: IReelTweenConfig = {
            to: this.config.postRollTiles,
            time: postRollTimeDown,
            ease: Easing.Quadratic.Out,
            onStart: this.onPostRollStart,
            onUpdate: this.onRollUpdate
        };

        let postRollTweenDown = Reel.createRollTween(tweenDownConfig);

        const tweenUpConfig: IReelTweenConfig = {
            to: -this.config.postRollTiles,
            time: postRollTimeUp,
            ease: Easing.Quadratic.In,
            onStart: this.setStartPositions,
            onUpdate: this.onRollUpdate,
            onComplete: this.onPostRollFinish
        };
        let postRollTweenUp = Reel.createRollTween(tweenUpConfig);

        postRollTweenDown.chain(postRollTweenUp);
        postRollTweenDown.start();
    }


    private updatezOrder(): void {
        this.children.sort((a: Tile, b: Tile) => {
            a.zIndex = a.zIndex || 0;
            b.zIndex = b.zIndex || 0;
            return (a.zIndex - b.zIndex);
        });
    }

    private rearrangeReel(): void {
        for (let t = 0; t < this.tiles.length; t++) {
            this.rearrangeTile(this.tiles[t]);
        }
    }

    private rearrangeTile(tile: Tile): void {
        while (tile.y >= this._maxYposition) {
            tile.y -= (this._maxYposition + this.config.yPeriod);
        }
        while (tile.y < -this.config.yPeriod) {
            tile.y += (this._maxYposition + this.config.yPeriod);
        }
    }

    private addMask(maskData: number[]): void {
        if (!maskData) return console.warn("mask polygon isn't found");
        let maskShape = this.addChild(new PIXI.Graphics());
        maskShape.beginFill(0x00FF00, 0.5);
        maskShape.lineStyle(2, 0xff0000, 1, 1);
        maskShape.drawPolygon(maskData).endFill();

        if (!this.config.showMask) {
            this.mask = maskShape;
        }
    }

    private setStartPositions(): void {
        this._startPositions = [];
        for (let t = 0; t < this.tiles.length; t++) {
            this._startPositions.push(this.tiles[t].y);
        }
    }

    private onRollUpdate(o: any): void {
        this.updateTiles(o);
    }

    private updateTiles(o: any): void {
        for (let t = 0; t < this.tiles.length; t++) {
            this.tiles[t].y = this._startPositions[t] + this.config.yPeriod * o.tilesToRoll;
            this.rearrangeTile(this.tiles[t]);
        }
        this.visibilityCheck();
    }

    private visibilityCheck(): void {
        for (let i = 0; i < this.tiles.length; i++) {
            const tile = this.tiles[i];
            tile.visible = !((tile.y >= -this.config.yPeriod && tile.y < -100) || (tile.y <= this._maxYposition && tile.y > this._maxYposition - (this.config.yPeriod * 1.5)));
        }
    }

    private onPreRollStart(): void {
        this.emit(EVENTS.REEL.START, this);
        this.emit(EVENTS.REEL.PREROLL, this);
        this.setStartPositions();
        this.preRolling = true;
        this.rolling = false;
        this.postRolling = false;
        this.finished = false;
    }

    private onRollStart(): void {
        this.emit(EVENTS.REEL.ROLL, this);
        this.setStartPositions();
        this.preRolling = false;
        this.rolling = true;
        this.postRolling = false;
        this.finished = false;
    }

    private onPostRollStart(): void {
        this.emit(EVENTS.REEL.POSTROLL, this);
        this.setStartPositions();
        this.preRolling = false;
        this.rolling = false;
        this.postRolling = true;
        this.finished = false;
    }

    private onPostRollFinish(): void {
        this.emit(EVENTS.REEL.FINISH, this);
        this.preRolling = false;
        this.rolling = false;
        this.postRolling = false;
        this.finished = true;
    }
}