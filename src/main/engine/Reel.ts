import {ISlotsConfig} from "./interfaces/ISlotsConfig";
import Tile from "./Tile";
import Sprite from "../../utils/Sprite";
import {Tween, Easing} from "@tweenjs/tween.js";
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
    readonly maxYposition: number;

    private _startPositions: number[];
    private _distance: number;
    private _tilesToRoll: number;

    private static _createRollTween(config: IReelTweenConfig): Tween {
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
        this._createTiles(reelTiles);

        this.maxYposition = this.config.yPeriod * (this.tiles.length - 1);

        this._addMask(maskPolygon);
        this._rearrangeReel();

        this._updatezOrder();
        this._visibilityCheck();

        // ROLLING BINDS
        this._setStartPositions = this._setStartPositions.bind(this);
        this._onPreRollStart = this._onPreRollStart.bind(this);
        this._onRollStart = this._onRollStart.bind(this);
        this._onPostRollStart = this._onPostRollStart.bind(this);
        this._onRollUpdate = this._onRollUpdate.bind(this);
        this._onPostRollFinish = this._onPostRollFinish.bind(this);
    }

    public roll(distanceTiles: number): void {
        this._tilesToRoll = distanceTiles;
        this._preRoll(); // start of tween chain
    }

    private _createTiles(reelTiles: Tile[]): void {
        let tile = null;
        for (let f = 0; f < reelTiles.length; f++) {
            tile = reelTiles[f];
            tile.y = f * this.config.yPeriod;
            tile.scale.set(this.config.tileScale);
            this.addChild(tile);
            this.tiles.push(tile);
        }
    }

    private _preRoll(): void {
        // PRE-ROLL TWEEN
        let preRollTimeUp = this.config.yPeriod * this.config.preRollTiles / this.config.speed * this.config.startEndSpeedMultiplier;
        let preRollTimeDown = this.config.yPeriod * this.config.preRollTiles / this.config.speed * this.config.startEndSpeedMultiplier / 4;

        const tweenUpConfig: IReelTweenConfig = {
            to: -this.config.preRollTiles,
            time: preRollTimeUp,
            ease: Easing.Quadratic.Out,
            onStart: this._onPreRollStart,
            onUpdate: this._onRollUpdate
        };
        let preRollTweenUp = Reel._createRollTween(tweenUpConfig);

        const tweenDownConfig: IReelTweenConfig = {
            to: this.config.preRollTiles,
            time: preRollTimeDown,
            ease: Easing.Quadratic.In,
            onStart: this._setStartPositions,
            onUpdate: this._onRollUpdate,
            onComplete: this._mainRoll.bind(this)
        };
        let preRollTweenDown = Reel._createRollTween(tweenDownConfig);

        preRollTweenUp.chain(preRollTweenDown);
        preRollTweenUp.start();
    }

    private _mainRoll(): void {
        // ROLLING TWEEN
        this._tilesToRoll = (this._tilesToRoll >= 0) ? this._tilesToRoll : 0;
        this._distance = this._tilesToRoll * this.config.yPeriod;
        const rollTime = this._distance / this.config.speed;

        const tweenMainConfig: IReelTweenConfig = {
            to: this._tilesToRoll,
            time: rollTime,
            ease: null,
            onStart: this._onRollStart,
            onUpdate: this._onRollUpdate,
            onComplete: this._postRoll.bind(this)
        };
        let mainRollTween = Reel._createRollTween(tweenMainConfig);

        mainRollTween.start();
    }

    private _postRoll(): void {
        // POST-ROLL TWEENS
        let postRollTimeDown = this.config.yPeriod * this.config.postRollTiles / this.config.speed * this.config.startEndSpeedMultiplier;
        let postRollTimeUp = this.config.yPeriod * this.config.postRollTiles / this.config.speed * this.config.startEndSpeedMultiplier / 4;

        const tweenDownConfig: IReelTweenConfig = {
            to: this.config.postRollTiles,
            time: postRollTimeDown,
            ease: Easing.Quadratic.Out,
            onStart: this._onPostRollStart,
            onUpdate: this._onRollUpdate
        };

        let postRollTweenDown = Reel._createRollTween(tweenDownConfig);

        const tweenUpConfig: IReelTweenConfig = {
            to: -this.config.postRollTiles,
            time: postRollTimeUp,
            ease: Easing.Quadratic.In,
            onStart: this._setStartPositions,
            onUpdate: this._onRollUpdate,
            onComplete: this._onPostRollFinish
        };
        let postRollTweenUp = Reel._createRollTween(tweenUpConfig);

        postRollTweenDown.chain(postRollTweenUp);
        postRollTweenDown.start();
    }


    private _updatezOrder(): void {
        this.children.sort((a: Tile, b: Tile) => {
            a.zIndex = a.zIndex || 0;
            b.zIndex = b.zIndex || 0;
            return (a.zIndex - b.zIndex);
        });
    }

    private _rearrangeReel(): void {
        for (let t = 0; t < this.tiles.length; t++) {
            this._rearrangeTile(this.tiles[t]);
        }
    }

    private _rearrangeTile(tile: Tile): void {
        while (tile.y >= this.maxYposition) {
            tile.y -= (this.maxYposition + this.config.yPeriod);
        }
        while (tile.y < -this.config.yPeriod) {
            tile.y += (this.maxYposition + this.config.yPeriod);
        }
    }

    private _addMask(maskData: number[]): void {
        if (!maskData) return console.warn("mask polygon isn't found");
        let maskShape = this.addChild(new PIXI.Graphics());
        maskShape.beginFill(0x00FF00, 0.5);
        maskShape.lineStyle(2, 0xff0000, 1, 1);
        maskShape.drawPolygon(maskData).endFill();

        if (!this.config.showMask) {
            this.mask = maskShape;
        }
    }

    private _setStartPositions(): void {
        this._startPositions = [];
        for (let t = 0; t < this.tiles.length; t++) {
            this._startPositions.push(this.tiles[t].y);
        }
    }

    private _onRollUpdate(o: any): void {
        this._updateTiles(o);
    }

    private _updateTiles(o: any): void {
        for (let t = 0; t < this.tiles.length; t++) {
            this.tiles[t].y = this._startPositions[t] + this.config.yPeriod * o.tilesToRoll;
            this._rearrangeTile(this.tiles[t]);
        }
        this._visibilityCheck();
    }

    private _visibilityCheck(): void {
        for (let i = 0; i < this.tiles.length; i++) {
            const tile = this.tiles[i];
            tile.visible = !((tile.y >= -this.config.yPeriod && tile.y < -100) || (tile.y <= this.maxYposition && tile.y > this.maxYposition - (this.config.yPeriod * 1.5)));
        }
    }

    private _onPreRollStart(): void {
        this.emit(EVENTS.REEL.START, this);
        this.emit(EVENTS.REEL.PREROLL, this);
        this._setStartPositions();
        this.preRolling = true;
        this.rolling = false;
        this.postRolling = false;
        this.finished = false;
    }

    private _onRollStart(): void {
        this.emit(EVENTS.REEL.ROLL, this);
        this._setStartPositions();
        this.preRolling = false;
        this.rolling = true;
        this.postRolling = false;
        this.finished = false;
    }

    private _onPostRollStart(): void {
        this.emit(EVENTS.REEL.POSTROLL, this);
        this._setStartPositions();
        this.preRolling = false;
        this.rolling = false;
        this.postRolling = true;
        this.finished = false;
    }

    private _onPostRollFinish(): void {
        this.emit(EVENTS.REEL.FINISH, this);
        this.preRolling = false;
        this.rolling = false;
        this.postRolling = false;
        this.finished = true;
    }
}