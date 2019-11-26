import { CONFIG } from '../config/config';
/**
 * few useful utils
 *
 * @class Utils
 */
export default class Utils{

    static randomInt(min:number, max:number):number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static getShaderSize():number {
        let width = CONFIG.APP_WIDTH,
            height = CONFIG.APP_HEIGHT,
            maxSide = (width > height) ? width : height;

        return maxSide*2;
    }
}
