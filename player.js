import { canvas, ctx, level, levelHeight, levelWidth, playerSize, tileSize } from "./main.js";

const player = {
    x: 32, // start from top left corner
    y: 32,
    w: 32,
    h: 32,
    dx: 0,
    dy: 0,
    movementSpeed: 2.
};

export function renderPlayer()
{
    // Left
    if (player.x <= tileSize) {
        player.x = tileSize;
    }

    // Right
    if (player.x >= (levelWidth - 2) * tileSize) {
        player.x = (levelWidth - 2) * tileSize;
    }

    // Top
    if (player.y <= tileSize) {
        player.y = tileSize;
    }

    // Bottom
    if (player.y >= (levelHeight - 2) * tileSize) {
        player.y = (levelHeight - 2) *tileSize;
    }

    player.x += player.dx;
    player.y += player.dy;

    ctx.fillStyle = "#ff0000";
    ctx.fillRect(player.x, player.y, playerSize, playerSize);
}

////////////////////
// Inputs
function handleKeyDown(event)
{
    event.preventDefault();

    switch(event.key) {
        case "w":
            player.dy = -player.movementSpeed;
            break;

        case "a":
            player.dx = -player.movementSpeed;
            break;

        case "s":
            player.dy = player.movementSpeed;
            break;

        case "d":
            player.dx = player.movementSpeed;
            break;
    }
}

function handleKeyUp(event)
{
    event.preventDefault();

    switch(event.key) {
        case "w":
        case "s":
            player.dy = 0;
            break;

        case "a":
        case "d":
            player.dx = 0;
            break;
    }
}

////////////////////
// DOM
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

