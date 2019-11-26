import * as PIXI from 'pixi.js';
import ASSETS from '../assets';
import Sprite from '../utils/Sprite';
import Utils from '../utils/Utils';
import ProgressBar from './ProgressBar';
import { EVENTS } from '../config/events';

/**
 * Game Loader, load all game assets
 *
 * @class LoaderUI
 * @extends PIXI.Container
 */

const SPINNER_ROTATION_PERIOD = 400;

export default class LoaderUI extends PIXI.Container{
    private _screen:PIXI.Graphics;
    private _spinner:Sprite;
    private _progressBar:ProgressBar;

    constructor() {
        super();

        this._init();
    }

    public tick(delta:number):void {
        if(this._spinner){
            this._spinner.rotation += delta/SPINNER_ROTATION_PERIOD;
        }
    }

    //load images to use them in Loader
    private _init():void {
        this._screen = this._initPreloadScreen();
        this._redrawScreen(0x000000);

        for(let i = 0; i < ASSETS.preloadImages.length; i++) {
            PIXI.loader.add(ASSETS.preloadImages[i].name, ASSETS.preloadImages[i].content);
        }

        PIXI.loader.load(() => {
            this._onPreloadEnd();
        });
    }

    private _initPreloadScreen():PIXI.Graphics {
        return this.addChild(new PIXI.Graphics());
    }

    private _redrawScreen(color:number):void {
        let size = Utils.getShaderSize();

        this._screen.clear()
            .beginFill(color, 1)
            .drawRect(0, 0, size,size);
        this._screen.position.set(-size/2, -size/2);
    }

    private _onPreloadEnd():void {
        this._initLoadAnimation();
        this._redrawScreen(0xffffff);

        PIXI.loader.on('progress',(loader) =>
            this._updateProgressBar(loader.progress)
        );

        ASSETS.images.forEach(image => {
            PIXI.loader.add(image.name, image.content);
        });
        ASSETS.sounds.forEach(sound => {
            PIXI.loader.add(sound.name, sound.content);
        });
        ASSETS.particles.forEach(particle => {
            PIXI.loader.add(particle.name, particle.content);
        });

        PIXI.loader.load(() => {
            this.emit(EVENTS.LOADER.LOAD_END);
        });
    }

    private _initLoadAnimation():void {
        this._spinner = this.addChild(new Sprite("preload_spinner"));
        this._progressBar = this.addChild(new ProgressBar());
    }

    private _updateProgressBar(progress:number):void {
        if(this._progressBar){
            this._progressBar.update(progress);
        }
    }

}
