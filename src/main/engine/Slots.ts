import Reel from "./Reel";
import Tile from "./Tile";
import {ISlotsConfig} from "./interfaces/ISlotsConfig";
import Sprite from "../../utils/Sprite";
import {EVENTS} from "../../config/events";

export interface IReelEvent {
    slots: Slots,
    reel: Reel,
    reelNumber: number
}

export interface ITilesPredictionEvent {
    slots: Slots,
    tilesMap: string[][]
}

export interface ITilesLogicEvent {
    slots: Slots,
    tilesMap: Tile[][]
}

export default class Slots extends PIXI.Sprite {

    public tilesMap: Tile[][];

    readonly config: ISlotsConfig;

    readonly background: Sprite;
    readonly foreground: Sprite;
    private _reels: Reel[];
    private _rollingReels: number;
    private _rollDistances: number[];

    public static fromArray(displayList: string[], reelsNumber: number, config: ISlotsConfig, maskPolygons: number[][]): Slots {
        if (Math.floor(reelsNumber) < 1) {
            throw Error("reelsNumber must be an 1 or more");
        }

        let tileList: Tile[] = [];
        for (let i = 0; i < displayList.length; i++) {
            tileList.push(Tile.create(displayList[i]));
        }

        let tiles = Slots.buildSrcArray(tileList, reelsNumber);

        return new Slots(tiles, maskPolygons, config);
    }

    public static buildSrcArray(srcArray: Tile[], reelsNumber: number): Tile[][] {
        let tiles: Tile[][] = [];
        for (let r = 0; r < reelsNumber; r++) {
            tiles.push([]);
            for (let i = r; i < srcArray.length; i += reelsNumber) {
                if (Array.isArray(srcArray[i])) {
                    console.warn("srcArray: one-dimention array expected");
                }
                tiles[r].push(srcArray[i]);
            }
        }
        return tiles;
    }

    constructor(tiles: Tile[][], maskPolygons: number[][], config: ISlotsConfig) {
        super();
        maskPolygons = maskPolygons || [];
        // DEFAULT CONFIG
        this.config = config;

        this.background = this.addChild(new Sprite(this.config.background));

        // ADDING EVERY REEL
        this._reels = [];
        this._addReels(tiles, maskPolygons);
        this.foreground = this.addChild(new Sprite(this.config.foreground));

        // SUBSCRIBTION
        for (let re = 0; re < this._reels.length; re++) {
            this._reels[re].on(EVENTS.REEL.START, this._onReelStart, this);
            this._reels[re].on(EVENTS.REEL.PREROLL, this._onReelPreroll, this);
            this._reels[re].on(EVENTS.REEL.ROLL, this._onReelRoll, this);
            this._reels[re].on(EVENTS.REEL.POSTROLL, this._onReelPostroll, this);
            this._reels[re].on(EVENTS.REEL.FINISH, this._onReelFinish, this);
        }

        this.tilesMap = [];
        this._createTilesMap(tiles);
        this._rollingReels = 0;
        this._rollDistances = [];
    }

    public rollBy(rollDistances: number[]): void {
        this._rollDistances = rollDistances.concat();
        let rollTiles = rollDistances.concat();
        this._rollingReels = 0;

        for (let i = 0; i < rollTiles.length; i++) {
            rollTiles[i] = Math.floor(rollTiles[i]);
            if (isNaN(rollTiles[i])) {
                rollTiles[i] = null;
            } else {
                this._rollingReels++;
            }
        }
        this._rollingReels = Math.min(this._rollingReels, this.tilesMap.length);

        const eventStart: ITilesLogicEvent = {slots: this, tilesMap: this.tilesMap};
        this.emit(EVENTS.SLOTS.ROLL_START, eventStart);

        let tempTiles: string[][] = [];
        for (let k = 0; k < this.tilesMap.length; k++) {
            tempTiles[k] = [];
            for (let h = 0; h < this.tilesMap[k].length; h++) {
                tempTiles[k].push(this.tilesMap[k][h].type);
            }
        }

        // tslint:disable-next-line:no-unused-expression
        for (let i = 0; i < rollTiles.length, i < this.tilesMap.length; i++) {
            if (isNaN(Math.floor(rollTiles[i]))) {
                continue;
            }
            // VIEW
            this._reels[i].roll(rollTiles[i]);
            // PREDICITION
            for (let r = 0; r < rollTiles[i]; r++) {
                tempTiles[i].unshift(tempTiles[i].pop());
            }
        }
        const eventPrediction: ITilesPredictionEvent = {slots: this, tilesMap: tempTiles};
        this.emit(EVENTS.SLOTS.PREDICTION_RESULT, eventPrediction);
    }

    public getRow(rowNumber: number): Tile[] {
        let row: Tile[] = [];
        for (let i = 0; i < this.tilesMap.length; i++) {
            row.push(this.tilesMap[i][rowNumber]);
        }
        return row;
    }

    public getColumn(reelNumber: number): Tile[] {
        return [].concat(this.tilesMap[reelNumber]);
    }

    public getTile(col: number, row: number): Tile {
        return this.tilesMap[col][row];
    }

    private _addReels(tilesArray: Tile[][], maskPolygons: number[][]): void {
        const margin = this.config.margin;
        const xPeriod = this.config.xPeriod;
        const yPeriod = this.config.yPeriod;
        const visibleRows = this.config.visibleRows;

        for (let i = 0; i < tilesArray.length; i++) {
            let reelNumber = i;
            let reelTiles = tilesArray[i];
            let maskPolygon = maskPolygons[i]
                || [
                    -xPeriod / 2 + margin, -yPeriod / 2 + margin,
                    xPeriod / 2 - margin, -yPeriod / 2 + margin,
                    xPeriod / 2 - margin, -yPeriod / 2 + yPeriod * visibleRows - margin,
                    -xPeriod / 2 + margin, -yPeriod / 2 + yPeriod * visibleRows - margin,
                    -xPeriod / 2 + margin, -yPeriod / 2 + margin
                ];

            let reel = new Reel(reelNumber, reelTiles, maskPolygon, this.config);
            this.addChild(reel);
            this._reels.push(reel);
            this._alignReels();
        }
    }


    private _onReelStart(e: any): void {
        const event: IReelEvent = {slots: this, reel: e, reelNumber: e.reelNumber};
        this.emit(EVENTS.SLOTS.START_REEL, event);
    }

    private _onReelPreroll(e: any): void {
        const event: IReelEvent = {slots: this, reel: e, reelNumber: e.reelNumber};
        this.emit(EVENTS.SLOTS.PREROLL_REEL, event);
    }

    private _onReelRoll(e: any): void {
        const event: IReelEvent = {slots: this, reel: e, reelNumber: e.reelNumber};
        this.emit(EVENTS.SLOTS.ROLL_REEL, event);
    }

    private _onReelPostroll(e: any): void {
        const event: IReelEvent = {slots: this, reel: e, reelNumber: e.reelNumber};
        this.emit(EVENTS.SLOTS.POSTROLL_REEL, event);
    }

    private _onReelFinish(e: any): void {
        const event: IReelEvent = {slots: this, reel: e, reelNumber: e.reelNumber};
        this.emit(EVENTS.SLOTS.FINISH_REEL, event);
        if (!this._rollingReels) {
            return;
        }
        this._rollingReels--;

        if (this._rollingReels === 0) {
            this._calcResult(this._rollDistances);
            const eventFinish: ITilesLogicEvent = {slots: this, tilesMap: this.tilesMap};
            this.emit(EVENTS.SLOTS.SPIN_END, eventFinish);
        }
    }

    private _calcResult(distances: number[]): void {
        // tslint:disable-next-line:no-unused-expression
        for (let i = 0; i < distances.length, i < this.tilesMap.length; i++) {
            distances[i] = Math.floor(distances[i]);
            if (isNaN(distances[i])) {
                continue;
            }

            //LOGIC
            for (let r = 0; r < distances[i]; r++) {
                this.tilesMap[i].unshift(this.tilesMap[i].pop());
            }
        }
    }

    private _alignReels(): void {
        for (let co = 0; co < this._reels.length; co++) {
            this._reels[co].x = (-this._reels.length / 2 + co + 0.5) * this.config.xPeriod + this.config.offsetX;
            this._reels[co].y = -this.config.yPeriod * (this.config.visibleRows - 1) / 2 + this.config.offsetY;
        }
    }

    private _createTilesMap(tilesArray: Tile[][]): Tile[][] {
        this.tilesMap = [];
        for (let i = 0; i < tilesArray.length; i++) {

            this.tilesMap.push([]);
            for (let j = 0; j < tilesArray[i].length; j++) {
                this.tilesMap[i].push(tilesArray[i][j]);
            }
        }
        return this.tilesMap;
    }

}
