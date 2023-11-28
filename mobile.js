import { setCameraOffsets } from "./camera.js";
import { globalPause, setGlobalPause } from "./main.js";

export let isMobile = false;

export function responsivityCheck() {
    // Bools
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;

    if (window.innerHeight < 400) {
        isMobile = true;
        setCameraOffsets();
        resizeCanvas();
        return true;
    } else {
        isMobile = false;
        setCameraOffsets();
        fullsizeCanvas();
        return false;
    }
}

/////////////////
// Resize canvas
let canvas = document.getElementById('canvas');
let floor = document.querySelector('.floor');

function fullsizeCanvas() {
    let size = 832;

    canvas.width = size;
    canvas.height = size;

    floor.style.width = `${size}px`;
    floor.style.height = `${size}px`;
}

function resizeCanvas() {
    const windowHeight = window.innerHeight;

    canvas.width = windowHeight;
    canvas.height = windowHeight;

    floor.style.width = `${windowHeight}px`
    floor.style.height = `${windowHeight}px`
}

window.addEventListener('resize', responsivityCheck);

//////////////////////
// Full screen button
const fsBtn = document.getElementById('fullscreen-button');
fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen();
    }
})