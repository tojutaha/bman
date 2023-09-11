import { canvas, ctx, tileSize, levelHeight, levelWidth } from "./main.js";

const TileType = {
    FLOOR: "Floor",
    NON_DESTRUCTIBLE_WALL: "NonDestructibleWall",
    DESTRUCTIBLE_WALL: "DestructibleWall",
};

function Tile(x, y, isWalkable, type) {
    this.x = x || 0,
    this.y = y || 0,
    this.isWalkable = isWalkable || false,
    this.type = type || TileType.FLOOR
    // tekstuurit jne vois laitella myös tänne.
};

export function createTiles()
{
    const result = [];

    for (let y = 0; y < levelHeight; y++) {
        const row = [];
        for (let x = 0; x < levelWidth; x++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;

            // Non-destructible walls
            if (x === 0 || y === 0 || x === levelWidth - 1 || y === levelHeight - 1) {
                row.push(new Tile(xCoord, yCoord, false, TileType.NON_DESTRUCTIBLE_WALL));
            } else if (x % 2 === 0 && y % 2 === 0) {
                row.push(new Tile(xCoord, yCoord, false, TileType.NON_DESTRUCTIBLE_WALL));
            }
            // TODO: destructible walls etc.
            // Floor
            else {
                row.push(new Tile(xCoord, yCoord, true, TileType.FLOOR));
            }
        }
        result.push(row);
    }

    return result;
}

