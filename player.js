import { canvas, ctx, playerSize, tileSize } from "./main.js";

const player = {
    x: 32, // start from top left corner
    y: 32,
    w: 32,
    h: 32,
    dx: 0,
    dy: 0,
};

export function renderPlayer()
{
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(player.x, player.y, playerSize, playerSize);
}
