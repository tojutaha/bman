import { canvas, ctx, tileSize, levelHeight, levelWidth, softTilePercent, powerUpCount } from "./main.js";
import { randomPowerup } from "./powerup.js";

// TODO: Säätää poweruppien ja softblokkien rändömöinti

const TileType = {
    FLOOR: "Floor",
    NON_DESTRUCTIBLE_WALL: "NonDestructibleWall",
    DESTRUCTIBLE_WALL: "DestructibleWall",
};

function Tile(x, y, isWalkable, isDeadly, hasPowerup, powerup, type) {
    this.x = x || 0,
    this.y = y || 0,
    this.isWalkable = isWalkable || false,
    this.isDeadly = isDeadly || false,
    this.hasPowerup = hasPowerup || false;
    this.powerup = powerup || "None";
    this.type = type || TileType.FLOOR
    // tekstuurit jne vois laitella myös tänne.
};

export function createTiles()
{
    const result = [];
    let powerupsLeft = powerUpCount;

    for (let x = 0; x < levelWidth; x++) {
        const column = [];
        for (let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;

            // Outer walls
            if (x === 0 || y === 0 || x === levelWidth - 1 || y === levelHeight - 1) {
                column.push(new Tile(xCoord, yCoord, false, false, false, "None", TileType.NON_DESTRUCTIBLE_WALL));
            } 
            // Hard tiles
            else if (x % 2 === 0 && y % 2 === 0) {
                column.push(new Tile(xCoord, yCoord, false, false, false, "None", TileType.NON_DESTRUCTIBLE_WALL));
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
                    // Populating random powerups behind some walls
                    if (powerupsLeft > 0 && random < 0.05) { // TODO: säädä rändömöinti
                        const powerup = randomPowerup();
                        powerupsLeft--;
                        // console.log(powerup, "in", xCoord, yCoord);
                        column.push(new Tile(xCoord, yCoord, false, false, true, powerup, TileType.DESTRUCTIBLE_WALL));
                    } else {
                        column.push(new Tile(xCoord, yCoord, false, false, false, "None", TileType.DESTRUCTIBLE_WALL));
                    }
                }
                else {
                    column.push(new Tile(xCoord, yCoord, true, false, false, "None", TileType.FLOOR));
                }
            }
        }
        result.push(column);
    }
    return result;
}