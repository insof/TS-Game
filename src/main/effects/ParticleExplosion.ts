import Sprite from "../../utils/Sprite";
import {Emitter} from 'pixi-particles';

/**
 * ParticleExplosion animation, use particle effect
 *
 * @class ParticleExplosion
 * @extends Sprite
 */

export class ParticleExplosion extends Sprite {
    public emitter: Emitter;

    constructor() {
        super();

        this._addParticles();
    }

    public tick(delta: number): void {
        this.emitter.update(delta / 1000);
    }

    private _addParticles(): void {
        let textures = [];
        for (let i = 0; i < 10; i++) {
            textures.push(PIXI.Texture.fromFrame("particles/"+i));
        }
        const particleConfig = PIXI.loader.resources.explode.data;
        this.emitter = new Emitter(this, textures, particleConfig);

        this.emitter.emit = true;
    }

}
