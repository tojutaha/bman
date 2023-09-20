import { maxBombs, setMaxBombs, maxRange, setMaxRange } from "./bomb.js";
import { smoothMovementSpeed, setMovementSpeed } from "./player.js";
import { ctx, spriteSheet, level, levelHeight, levelWidth, tileSize, powerUpCount } from "./main.js";

const powerups = ["ExtraBomb", "ExtraRange", "ExtraSpeed"];

export function randomPowerup() {
    return powerups[Math.floor(Math.random() * powerups.length)];
}

export function pickPowerup(tile) {
    console.info("Picked", tile.powerup, "from", tile.x, tile.y);
    tile.hasPowerup = false;

    if (tile.powerup === "ExtraBomb") {
        const newMaxBombs = maxBombs + 1;
        setMaxBombs(newMaxBombs);
    }
    else if (tile.powerup === "ExtraRange") {
        const newMaxRange = maxRange + 1;
        setMaxRange(newMaxRange);
    }

    else if (tile.powerup === "ExtraSpeed") {
        const newSpeed = smoothMovementSpeed + 0.5;
        setMovementSpeed(newSpeed);
    }
}

////////////////////
// Render
export function renderPowerups()
{
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;
            const currentTile = level[x][y];

            if (currentTile.hasPowerup) {
                if (currentTile.powerup === "ExtraBomb") {
                    ctx.drawImage(spriteSheet, 0, 128, 32, 32, xCoord, yCoord, tileSize, tileSize);
                }
                else if (currentTile.powerup === "ExtraRange") {
                    ctx.drawImage(spriteSheet, 32, 128, 32, 32, xCoord, yCoord, tileSize, tileSize);
                }
                else if (currentTile.powerup === "ExtraSpeed") {
                    ctx.drawImage(spriteSheet, 64, 128, 32, 32, xCoord, yCoord, tileSize, tileSize);
                }
            }
        }
    }
}
