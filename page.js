import { ctx, tileSize, levelHeight, levelWidth } from "./main.js";

////////////////////
// Show coordinates
let coordButton = document.getElementById("show-coords");
export let coordsToggle = false;
coordButton.addEventListener("click", function() {
    coordsToggle = !coordsToggle;
});

export function drawCoordinates(coordsToggle) {
    ctx.fillStyle = "#eeed";
    ctx.lineWidth = 0.4;
    ctx.font = '10px Arial';
    ctx.textBaseline = 'hanging';

    let pad = 3;
    
    if (coordsToggle) {
        for (let x = 1; x < levelHeight -1; x++) {
            for (let y = 1; y < levelWidth -1; y++) {
                const yCoord = y * tileSize;
                const xCoord = x * tileSize;
                
                ctx.fillText(`${xCoord}`, yCoord + pad, xCoord + pad + 12);
                ctx.fillText(`${yCoord},`, yCoord + pad, xCoord + pad);
            }
        }
    }
}

////////////////////
// Scale buttons
let canvasContainer = document.getElementsByClassName("canvas-container");
let scaleBtn50 = document.getElementById("scale50");
let scaleBtn75 = document.getElementById("scale75");
let scaleBtn100 = document.getElementById("scale100");

scaleBtn50.addEventListener("click", scale50);
scaleBtn75.addEventListener("click", scale75);
scaleBtn100.addEventListener("click", scale100);

function scale50() {
    canvasContainer[0].style.cssText = "scale: 50%;";
}
function scale75() {
    canvasContainer[0].style.cssText = "scale: 75%;";
}
function scale100() {
    canvasContainer[0].style.cssText = "scale: 100%;";
}