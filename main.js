////////////////////
// Imports
import { renderLevel } from "./level.js";
import { createTiles } from "./tile.js";
import { renderPlayer } from "./player.js";

////////////////////
// Globals
export let canvas;
export let ctx;
export let level = [];

////////////////////
// Settings
export const tileSize = 32;
export const playerSize = 32;
export const levelWidth = 25;
export const levelHeight = 25;
export const softTilePercent = 0.1;

////////////////////
// Assets
export let spriteSheet = document.getElementById("sprite-sheet");

////////////////////
// Render
let lastTimeStamp = 0;
function Render(timeStamp)
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const deltaTime = (timeStamp - lastTimeStamp) / 1000;
    const fps = 1 / deltaTime;

    renderLevel();
    renderPlayer(deltaTime);

    // 
    ctx.fillStyle = "#00ff00";
    ctx.font = "24px arial";
    ctx.fillText("FPS: " + fps.toFixed(1), canvas.width - 125, 25);
    ctx.fillText("dt:  " + (deltaTime*1000).toFixed(2) + "ms", canvas.width - 125, 50);
    //

    lastTimeStamp = timeStamp

    requestAnimationFrame(Render);
}

////////////////////
// DOM
document.addEventListener("DOMContentLoaded", function ()
{
    canvas = document.getElementById("canvas");
    if (canvas) {
        ctx = canvas.getContext("2d");
        if (ctx) {
            level = createTiles();
            Render();
        } else {
            console.error("Could not find ctx object.");
        }
    } else {
        console.error("Could not find canvas object.");
    }
});

