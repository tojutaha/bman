import { canvas, ctx, tileSize, levelHeight, levelWidth, level } from "./main.js";

export function renderLevel()
{
    for (let y = 0; y < levelHeight; y++) {
        for (let x = 0; x < levelWidth; x++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;
            // Hard tiles
            if (level[x][y].type === "NonDestructibleWall") {
                ctx.fillStyle = "#808080";
                ctx.fillRect(xCoord, yCoord, tileSize, tileSize);
            }
            // Soft tiles
            else if (level[x][y].type === "DestructibleWall") {
                ctx.fillStyle = "#E0E0E0";
                ctx.fillRect(xCoord, yCoord, tileSize, tileSize);
            }
            // Floor
            else if (level[x][y].type === "Floor") {
                ctx.fillStyle = "#2C492C";
                ctx.fillRect(xCoord, yCoord, tileSize, tileSize);
            }
        }
    }
}