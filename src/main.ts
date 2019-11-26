import {Application} from 'pixi.js';
import * as FontFaceObserver from 'fontfaceobserver';
import App from './main/App';
import ASSETS from './assets';
import {CONFIG} from "./config/config";

/**
 * Game init: create Application, add resize listener
 */

function environmentReady(): void {
    const app = new Application(CONFIG.APP_WIDTH, CONFIG.APP_HEIGHT, {transparent: true, backgroundColor: 0x000000});
    document.body.appendChild(app.view);

    const game = new App();

    for (let i = 0; i < ASSETS.fonts.length; i++) {
        if (i !== ASSETS.fonts.length - 1) {
            embedFont(ASSETS.fonts[i].name, ASSETS.fonts[i].content, null);
        } else {
            embedFont(ASSETS.fonts[i].name, ASSETS.fonts[i].content, () => {
                game.init(app);
            });
        }
    }
    window.addEventListener("resize", game.resize.bind(game));
    setInterval(game.resize.bind(game), 100); // must have on slow devices
    window.removeEventListener('load', environmentReady);
}

function embedFont(name: string, src: string, callback: Function): void {
    let s = document.createElement('style');
    s.type = "text/css";
    s.appendChild(document.createTextNode("@font-face {font-family: " + name + "; src: url(" + src + ");" + "}"));

    document.getElementsByTagName('head')[0].appendChild(s);

    let font = new FontFaceObserver(name);

    font.load().then(() => {
        if (callback) callback();
    });
}

window.addEventListener('load', environmentReady);

