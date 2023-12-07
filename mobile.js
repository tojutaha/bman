import { setCameraOffsets } from "./camera.js";
import { globalPause, setGlobalPause } from "./main.js";
import { spriteSheets } from "./spritesheets.js";

// TODO: Firefoxilla pelaaja pysähtyy jos kävelee ja hipaisee jonnekkin muualle ruutuun

export let isMobile = false;

export function responsivityCheck() {
    // Bools
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;

    if (window.innerHeight <= 428) {
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


//////////////////////
// Button presses
const bombBtn = document.getElementById('mob-bomb');
bombBtn.addEventListener('touchstart', () => {
    bombBtn.src = "./assets/mobile/bomb_btn_press.png";
})
bombBtn.addEventListener('touchend', () => {
    bombBtn.src = "./assets/mobile/bomb_btn.png";
})

const upBtn = document.getElementById('mob-dir-up');
upBtn.addEventListener('touchstart', () => {
    upBtn.src = "./assets/mobile/up_btn_press.png";
})
upBtn.addEventListener('touchend', () => {
    upBtn.src = "./assets/mobile/up_btn.png";
})

const leftBtn = document.getElementById('mob-dir-left');
leftBtn.addEventListener('touchstart', () => {
    leftBtn.src = "./assets/mobile/left_btn_press.png";
})
leftBtn.addEventListener('touchend', () => {
    leftBtn.src = "./assets/mobile/left_btn.png";
})

const rightBtn = document.getElementById('mob-dir-right');
rightBtn.addEventListener('touchstart', () => {
    rightBtn.src = "./assets/mobile/right_btn_press.png";
})
rightBtn.addEventListener('touchend', () => {
    rightBtn.src = "./assets/mobile/right_btn.png";
})

const downBtn = document.getElementById('mob-dir-down');
downBtn.addEventListener('touchstart', () => {
    downBtn.src = "./assets/mobile/down_btn_press.png";
})
downBtn.addEventListener('touchend', () => {
    downBtn.src = "./assets/mobile/down_btn.png";
})
