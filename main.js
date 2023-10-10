////////////////////
// Imports
import { createTiles } from "./tile.js";
import { renderWalls, renderFloor, renderExit, renderLevelHeader } from "./level.js";
import { renderPowerups } from "./powerup.js";
import { players, renderPlayer, resetPlayerPositions, spawnPlayers } from "./player.js";
import { renderEnemies, spawnEnemies } from "./enemy.js";
import { renderBombs, renderExplosions } from "./bomb.js";
import { Game } from "./gamestate.js";
import { updateCamera } from "./camera.js";

////////////////////
// Globals
export let canvas;
export let ctx;
export let game = new Game(); 
export let level = [];

////////////////////
// Settings
export const tileSize = 64;
export const levelWidth = 32;
export const levelHeight = 13;
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
export const scale = 1;
function Render(timeStamp)
{
    deltaTime = (timeStamp - lastTimeStamp) / 1000;
    ctx.save();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.restore();

    updateCamera();
    renderFloor();
    renderPowerups();
    renderExit();
    renderWalls();
    renderEnemies();
    renderBombs();
    renderExplosions();
    renderPlayer();
    renderLevelHeader();

    game.checkGameState();  // TODO: selkeämpi jos tää olis jossain process funktiossa kun ei oo render?

    /*
    const fps = 1 / deltaTime;
    ctx.fillStyle = "#a2f3a2";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.font = "24px Arial";
    ctx.strokeText("FPS: " + fps.toFixed(1), canvas.width - 125, 25);
    ctx.fillText("FPS: " + fps.toFixed(1), canvas.width - 125, 25);
    ctx.strokeText("dt:  " + (deltaTime*1000).toFixed(2) + "ms", canvas.width - 125, 50);
    ctx.fillText("dt:  " + (deltaTime*1000).toFixed(2) + "ms", canvas.width - 125, 50);
    */

    lastTimeStamp = timeStamp

    requestAnimationFrame(Render);
}

////////////////////
// Setters
export function loadLevel(loadedLevel) {    //  TODO: tarpeeton toistaiseksi 
    level = loadedLevel;
}

////////////////////
// New level
// TODO: tämä gamestateen vai tänne?
export function newLevel() {
    canvas = document.getElementById("canvas");
    if (canvas) {
        // Dynamic canvas size (ennen kameran seuraamista)
        // canvas.width = levelWidth * tileSize;
        // canvas.height = levelHeight * tileSize;
        ctx = canvas.getContext("2d");
        if (ctx) {
            level = createTiles();
            if (level.length > 0) {
                game.firstBombExploded = false;
                resetPlayerPositions();
                spawnEnemies();
            } else {
                throw new Error("Failed to create level");
            }
        } else {
            throw new Error("Could not find ctx object.");
        }
    } else {
        throw new Error("Could not find canvas object.");
    }
}

////////////////////
// DOM
document.addEventListener("DOMContentLoaded", function ()
{
    game.init();
    spawnPlayers();
    newLevel();
    game.loadGame();
    Render();
});

