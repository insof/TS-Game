import 'pixi-sound';
import ASSETS from '../assets';
import Sound = PIXI.sound.Sound;

/**
 * Game Audio Manager, manages background music and game sounds
 *
 * @class AudioManager
 */

export default class AudioManager {

    static musicEnabled:boolean;
    static soundsEnabled:boolean;
    static backgroundMusic:Sound;

    static init():void {
        let musicUrl = AudioManager.getSoundUrl("main_theme");

        AudioManager.musicEnabled = true;
        AudioManager.soundsEnabled = true;

        AudioManager.backgroundMusic = PIXI.sound.Sound.from(musicUrl);
        AudioManager.backgroundMusic.loop = true;
        AudioManager.backgroundMusic.volume = 0.1;
        AudioManager.backgroundMusic.speed = 1;
    }

    static speedUpBackground():void {
        AudioManager.backgroundMusic.speed = 1.2;
    }

    static playMusic():void {
        if(AudioManager.musicEnabled) {
            AudioManager.backgroundMusic.play();
        }
    }

    static disableMusic():void {
        AudioManager.backgroundMusic.stop();
    }

    static playSound(soundName:string):void {
        let soundUrl = AudioManager.getSoundUrl(soundName),
            sound = PIXI.sound.Sound.from(soundUrl);

        if(AudioManager.soundsEnabled) {
            sound.play();
        }
    }

    static getSoundUrl(name:string):string {
        for(let i = 0; i < ASSETS.sounds.length; i ++){
            if(ASSETS.sounds[i].name === name){
                return ASSETS.sounds[i].content;
            }
        }

        return null;
    }
}
