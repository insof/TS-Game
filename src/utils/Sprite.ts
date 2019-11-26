import * as PIXI from 'pixi.js';
import { Tween } from '@tweenjs/tween.js';
/**
 * Class Sprite, new animation methods added
 *
 * @class Sprite
 * @extends PIXI.Sprite
 */
export default class Sprite extends PIXI.Sprite{
    constructor(name?:string) {
        super();

        this.texture = name ? PIXI.Texture.fromFrame(name) : PIXI.Texture.EMPTY;

        this.anchor.set(0.5);
    }

    public fadeTo(alpha:number, time:number):Tween {
        return new Tween(this)
            .to({ alpha: alpha }, time)
            .start();
    }
}
