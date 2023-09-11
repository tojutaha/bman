////////////////////
// Imports
import { renderLevel } from "./level.js";
import { createTiles } from "./tile.js";

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

////////////////////
// Render
function Render()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    renderLevel();

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

