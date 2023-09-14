import { canvas, ctx, tileSize, levelHeight, levelWidth, level, spriteSheet } from "./main.js";

export function renderLevel()
{
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;
            // Hard tiles
            if (level[x][y].type === "NonDestructibleWall") {
                ctx.drawImage(spriteSheet, 0, 0, 32, 32, yCoord, xCoord, tileSize, tileSize);
            }
            // Soft tiles
            else if (level[x][y].type === "DestructibleWall") {
                ctx.drawImage(spriteSheet, 32, 0, 32, 32, yCoord, xCoord, tileSize, tileSize);
            }
            // Floor
            else if (level[x][y].type === "Floor") {
                ctx.fillStyle = "#4192c3";
                ctx.fillRect(yCoord, xCoord, tileSize, tileSize);
            }
        }
    }
}