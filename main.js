////////////////////
// Globals
let canvas;
let ctx;

////////////////////
// Settings
const tileSize = 32;
const levelWidth = 25;
const levelHeight = 25;

////////////////////
// Level
function renderLevel()
{
    for (let y = 0; y < levelHeight; y++) {
        for (let x = 0; x < levelWidth; x++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;
            // Non-destructible walls
            if (x === 0 || y === 0 || x === levelWidth-1 || y === levelHeight-1) {
                ctx.fillStyle = "#808080";
                ctx.fillRect(xCoord, yCoord, tileSize, tileSize);
            }
            else if (x % 2 === 0 && y %2 === 0 ) {
                ctx.fillStyle = "#808080";
                ctx.fillRect(xCoord, yCoord, tileSize, tileSize);
            }
            // TODO: destructible walls
            // Floor
            else {
                ctx.fillStyle = "#00ff00";
                ctx.fillRect(xCoord, yCoord, tileSize, tileSize);
            }
        }
    }
}

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
            Render();
        } else {
            console.error("Could not find ctx object.");
        }
    } else {
        console.error("Could not find canvas object.");
    }
});

