import { canvas, ctx, tileSize, levelHeight, levelWidth } from "./main.js";

export function renderLevel()
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
                ctx.fillStyle = "#2c492c";
                ctx.fillRect(xCoord, yCoord, tileSize, tileSize);
            }
        }
    }
}

