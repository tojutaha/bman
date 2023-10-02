////////////////////
// Imports
import { createTiles, exitLocation } from "./tile.js";
import { renderWalls, renderFloor, renderExit } from "./level.js";
import { renderPowerups } from "./powerup.js";
import { players, renderPlayer } from "./player.js";
import { renderEnemies, spawnEnemies } from "./enemy.js";
import { renderBombs, renderExplosions } from "./bomb.js";
import { Game } from "./gamestate.js";

////////////////////
// Globals
export let canvas;
export let ctx;
export let game = new Game(); 
export let level = [];

////////////////////
// Settings
export const tileSize = 32;
export const levelWidth = 25;
export const levelHeight = 25;
export const softTilePercent = 0.1;
export const powerUpCount = 1;
export const cagePlayers = false;

////////////////////
// Assets
export let spriteSheet = document.getElementById("sprite-sheet");

////////////////////
// Render
let lastTimeStamp = 0;
export let deltaTime = 16.6; // ~60fps alkuun..

let isPaused = false;

export function pause() {
    isPaused = !isPaused;
};

function Render(timeStamp)
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    deltaTime = (timeStamp - lastTimeStamp) / 1000;
    const fps = 1 / deltaTime;

    renderFloor();
    renderWalls();
    renderPowerups();
    renderExit();
    renderEnemies();
    renderBombs();
    renderExplosions();
    renderPlayer();

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
// Setters
export function loadLevel(loadedLevel) {
    level = loadedLevel;
}


// TODO: testailu kesken
export function newLevel() {
    isPaused = true;
    canvas = document.getElementById("canvas");
    if (canvas) {
        ctx = canvas.getContext("2d");
        if (ctx) {
            level = createTiles();
            if (level.length > 0) {
                spawnEnemies();
                // hmm
                players[0].resetPos();
                // exit ei toimi
                exitLocation.isOpen = false;
                isPaused = false;
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
}

////////////////////
// DOM
document.addEventListener("DOMContentLoaded", function ()
{
    newLevel();
    // ORIGINAL:
    // canvas = document.getElementById("canvas");
    // if (canvas) {
    //     ctx = canvas.getContext("2d");
    //     if (ctx) {
    //         level = createTiles();
    //         if (level.length > 0) {
    //             spawnEnemies();
    //         } else {
    //             console.error("Failed to create level");
    //         }

    //         Render();
    //     } else {
    //         console.error("Could not find ctx object.");
    //     }
    // } else {
    //     console.error("Could not find canvas object.");
    // }
});

