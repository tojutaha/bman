import { canvas, ctx, tileSize, levelHeight, levelWidth, softTilePercent } from "./main.js";

const TileType = {
    FLOOR: "Floor",
    NON_DESTRUCTIBLE_WALL: "NonDestructibleWall",
    DESTRUCTIBLE_WALL: "DestructibleWall",
};

function Tile(x, y, isWalkable, isDeadly, type) {
    this.x = x || 0,
    this.y = y || 0,
    this.isWalkable = isWalkable || false,
    this.isDeadly = isDeadly || false,
    this.type = type || TileType.FLOOR
    // tekstuurit jne vois laitella myös tänne.
};

export function createTiles()
{
    const result = [];

    for (let x = 0; x < levelWidth; x++) {
        const column = [];
        for (let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;

            // Outer walls
            if (x === 0 || y === 0 || x === levelWidth - 1 || y === levelHeight - 1) {
                column.push(new Tile(xCoord, yCoord, false, false, TileType.NON_DESTRUCTIBLE_WALL));
            } 
            // Hard tiles
            else if (x % 2 === 0 && y % 2 === 0) {
                column.push(new Tile(xCoord, yCoord, false, false, TileType.NON_DESTRUCTIBLE_WALL));
            }
            // Soft tiles and floor
            else {
                let random = Math.random();
                // Corners are left free from blocks
                if (random < softTilePercent 
                    && (x > 2 || y > 2) // top left
                    && (x > 2 || y < 22) // top right
                    && (x < 22 || y > 2) // bottom left
                    && (x < 22 || y < 22)) // bottom right
                    {
                    column.push(new Tile(xCoord, yCoord, false, false, TileType.DESTRUCTIBLE_WALL));
                }
                else {
                    column.push(new Tile(xCoord, yCoord, true, false, TileType.FLOOR));
                }
            }
        }
        result.push(column);
    }
    return result;
}

