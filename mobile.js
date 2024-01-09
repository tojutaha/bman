import { setCameraOffsets } from "./camera.js";
import { showPauseMenu } from "./page.js";

export let isMobile = false;

export function responsivityCheck() {
    // Bools
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
const canvas = document.getElementById('canvas');
const floor = document.querySelector('.floor');

function fullsizeCanvas() {
    const size = 832;

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
fsBtn.addEventListener('touchstart', () => {
    fsBtn.src = "./assets/mobile/fs_btn_press.png";
})
fsBtn.addEventListener('touchend', () => {
    fsBtn.src = "./assets/mobile/fs_btn.png";
})

const pauseBtn = document.getElementById('pause-button');
pauseBtn.addEventListener('touchstart', () => {
    pauseBtn.src = "./assets/mobile/pause_btn_press.png";
    showPauseMenu();
})
pauseBtn.addEventListener('touchend', () => {
    pauseBtn.src = "./assets/mobile/pause_btn.png";
})

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