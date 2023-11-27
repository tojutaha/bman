import { globalPause, setGlobalPause } from "./main.js";

export function responsivityCheck() {
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    
    if (isPortrait) {
        // console.log("Portrait");
        // setGlobalPause(!globalPause);    // TODO: ei toimi debuglatauksessa
    } else {
        // console.log("Not portrait");
        resizeCanvas();
    }

    if (isLandscape) {
        // console.log("landscape");
    }
}

/////////////////
// Resize canvas
let canvas = document.getElementById('canvas');
let floor = document.querySelector('.floor');

function resizeCanvas() {
    const windowHeight = window.innerHeight;

    canvas.width = windowHeight;
    canvas.height = windowHeight;

    floor.style.width = `${windowHeight}px`
    floor.style.height = `${windowHeight}px`
}

window.addEventListener('resize', responsivityCheck);