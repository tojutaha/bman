////////////////////
// Imports
import { renderLevel } from "./level.js";
import { createTiles } from "./tile.js";
import { renderPlayer } from "./player.js";
import { renderEnemies, initPathFinder } from "./enemy.js";
import { renderBombs, renderExplosions } from "./bomb.js";

////////////////////
// Globals
export let canvas;
export let ctx;
export let level = [];

////////////////////
// Settings
export const tileSize = 32;
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
    renderEnemies(deltaTime);
    renderBombs();
    renderExplosions();

    // 
    ctx.fillStyle = "#a2f3a2";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.font = "24px Arial";
    ctx.strokeText("FPS: " + fps.toFixed(1), canvas.width - 125, 25);
    ctx.fillText("FPS: " + fps.toFixed(1), canvas.width - 125, 25);
    ctx.strokeText("dt:  " + (deltaTime*1000).toFixed(2) + "ms", canvas.width - 125, 50);
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
            if (level.length > 0) {
                initPathFinder();
            } else {
                console.error("Failed to create level");
            }

            Render();
        } else {
            console.error("Could not find ctx object.");
        }
    } else {
        console.error("Could not find canvas object.");
    }
});

