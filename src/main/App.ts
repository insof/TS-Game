import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import {Game} from './Game';
import LoaderUI from '../media/LoaderUI';
import {Application} from "pixi.js";
import { EVENTS } from '../config/events';

/**
 * Game Application, change scenes, tick scenes, resize game
 *
 * @class App
 * @extends PIXI.utils.EventEmitter
 */

const MAX_DELTA = 100;

export default class App extends PIXI.utils.EventEmitter {
    private _width: number;
    private _height: number;
    private _app: Application;
    private _currentWindow: any;
    private _fpsView: PIXI.Text;
    private _fps: number;
    private _fpsDelay: number;
    private _lastFPS: number;

    private static getSystemFont(): string {
        return '-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif';
    }

    constructor() {
        super();

        this._width = 0;
        this._height = 0;
        this._fps = 0;
        this._fpsDelay = 0;
    }

    public init(app: Application): void {
        this._app = app;

        app.ticker.add(() => {
            this._tick();
        });
        app.ticker.add(() => {
            TWEEN.update();
        });

        this._preload();
    }

    public resize(forced: boolean): void {
        const width = window.innerWidth,
            height = window.innerHeight;
        if (!this._app) return;
        if (this._width === width && this._height === height && !forced) {
            return;
        }

        this._width = width;
        this._height = height;

        document.body.style.width = width + "px";
        document.body.style.height = height + "px";

        this._app.renderer.resize(width, height);

        if (this._currentWindow) {
            this._currentWindow.position.set(this._app.renderer.width / 2, this._app.renderer.height / 2);
            if (this._currentWindow.onResize) this._currentWindow.onResize(width, height);
            // this._currentWindow.scale.set(this._getScale());
        }
    }

    private _preload(): void {
        const loader = new LoaderUI();

        this._showWindow(loader);
        this._currentWindow.on(EVENTS.LOADER.LOAD_END, () => {
            this._start();
        });
    }

    private _start(): void {
        this._showWindow(new Game());
        this.addFPSView();
    }

    private _showWindow(scene: any): void {
        if (this._currentWindow) {
            this._app.stage.removeChild(this._currentWindow);
        }
        this._app.stage.addChildAt(scene, 0);
        this._currentWindow = scene;
        scene.position.set(this._app.renderer.width / 2, this._app.renderer.height / 2);

        this.resize(true);
    }

    private _tick(): void {
        let delta = PIXI.ticker.shared.elapsedMS;

        if (delta > MAX_DELTA) delta = MAX_DELTA;
        this.updateFPS(delta);
        if (this._currentWindow && this._currentWindow.tick) {
            this._currentWindow.tick(delta);
        }
    }

    // private _getScale(): number {
    //     return Math.min(this._width / CONFIG.APP_WIDTH, this._height / CONFIG.APP_HEIGHT);
    // }

    private addFPSView(): void {
        this._fpsView = this._app.stage.addChild(new PIXI.Text("FPS: 0", {
            fontFamily: App.getSystemFont(),
            fill: "#000000",
            fontSize: 30,
            lineJoin: "round",
            miterLimit: 10,
            stroke: "#ffffff",
            strokeThickness: 3
        }));
        this._fpsView.x = 12;
        this._fpsView.y = 6;
    }

    private updateFPS(delta: number): void {
        this._fps++;
        this._fpsDelay += delta;

        if (this._fpsView) {
            if (this._fpsDelay >= 1000) {
                while (this._fpsDelay > 1000) this._fpsDelay -= 1000;
                this._lastFPS = this._fps;
                this._fps = 0;
                this._fpsView.text = "FPS: " + this._lastFPS;
            }
        }
    }
}
