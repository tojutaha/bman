import { canvas, ctx, tileSize, levelHeight, levelWidth, softTilePercent, powerUpCount, cagePlayers } from "./main.js";
import { randomPowerup } from "./powerup.js";

// TODO: Siivoilla tätä, ehkä yhdistellä createPowerup ja createExit

let exitCreated = false;
export let exitLocation = undefined;

const TileType = {
    FLOOR: "Floor",
    HARD_WALL: "HardWall",
    SOFT_WALL: "SoftWall",
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

export function createTiles() {
    const result = [];
    let hardWallTotal = 0;

    for (let x = 0; x < levelWidth; x++) {
        const column = [];
        for (let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;

            // Outer walls
            if (x === 0 || y === 0 || x === levelWidth - 1 || y === levelHeight - 1) {
                column.push(new Tile(xCoord, yCoord, false, false, false, "None", TileType.HARD_WALL));
                hardWallTotal++;
            } 
            // Hard tiles
            else if (x % 2 === 0 && y % 2 === 0) {
                column.push(new Tile(xCoord, yCoord, false, false, false, "None", TileType.HARD_WALL));
                hardWallTotal++;
            }
            // Floor
            else {
                column.push(new Tile(xCoord, yCoord, true, false, false, "None", TileType.FLOOR));
            }
        }
        result.push(column);
    }

    let softWallTotal = createSoftWalls(result, hardWallTotal);
    createPowerups(result, softWallTotal);
    createExit(result);

    return result;
}

function createSoftWalls(result, hardWallTotal) {
    let softWallTotal = 0;
    
    const EMPTY_CORNERS = 12;
    let floorLeft = levelHeight * levelWidth - hardWallTotal - EMPTY_CORNERS;
    let softWallsLeft = Math.floor(floorLeft * softTilePercent);
    
    if (cagePlayers) {
        createCage(result);
        softWallTotal += 8;
    }
    
    while (softWallsLeft > 0) {
        const x = Math.floor(Math.random() * levelWidth);
        const y = Math.floor(Math.random() * levelHeight);
        const tile = result[x][y];

        if (tile.type === "Floor"
            // Leave floor for the corners so the players can move
            && (x > 2 || y > 2) // top left
            && (x > 2 || y < levelHeight - 3) // top right
            && (x < levelWidth - 3 || y > 2) // bottom left
            && (x < levelWidth - 3 || y < levelHeight - 3)) // bottom right) 
        {
            tile.type = "SoftWall";
            tile.isWalkable = false;
            softWallsLeft--;
            softWallTotal++;
        }
    }
    return softWallTotal;
}

// Add power-ups to behind random soft walls
function createPowerups(result, softWallCount) {
    let powerupsLeft = 0;
    // This is there for safety
    if (powerUpCount > softWallCount) {
        powerupsLeft = softWallCount;
    } else {
        powerupsLeft = powerUpCount;
    }

    while (powerupsLeft > 0) {
        const x = Math.floor(Math.random() * levelWidth);
        const y = Math.floor(Math.random() * levelHeight);
        const tile = result[x][y];

        if (tile.type === "SoftWall" && tile.hasPowerup === false) {
            tile.powerup = randomPowerup();
            tile.hasPowerup = randomPowerup();
            powerupsLeft--;
        }
    }
}

// TODO: Tän vois yhistellä ylemmän kanssa
function createExit(result) {
    while (exitCreated === false) {
        const x = Math.floor(Math.random() * levelWidth);
        const y = Math.floor(Math.random() * levelHeight);
        const tile = result[x][y];

        if (tile.type === "SoftWall" && tile.hasPowerup === false) {
            tile.isExit = true;
            tile.isOpen = false;
            exitCreated = true;
            exitLocation = tile;
            console.info("The door is in", tile.x, tile.y);
            break;
        }
    }
}

// Creates two soft wall tiles to make the player spawn safe
function createCage(result) {
    // Top right corner
    result[3][1].type = "SoftWall";
    result[3][1].isWalkable = false;
    result[1][3].type = "SoftWall";
    result[1][3].isWalkable = false;

    // Top left corner
    result[levelWidth - 4][1].type = "SoftWall";
    result[levelWidth - 4][1].isWalkable = false;
    result[levelWidth - 2][3].type = "SoftWall";
    result[levelWidth - 2][3].isWalkable = false;

    // Bottom left corner
    result[3][levelHeight - 2].type = "SoftWall";
    result[3][levelHeight - 2].isWalkable = false;
    result[1][levelHeight - 4].type = "SoftWall";
    result[1][levelHeight - 4].isWalkable = false;
    
    // Bottom right corner
    result[levelWidth - 4][levelHeight - 2].type = "SoftWall";
    result[levelWidth - 4][levelHeight - 2].isWalkable = false;
    result[levelWidth - 2][levelHeight - 4].type = "SoftWall";
    result[levelWidth - 2][levelHeight - 4].isWalkable = false;
}

// Exit loader
export function loadExit(loadedExit) {
    exitLocation = loadedExit;
}