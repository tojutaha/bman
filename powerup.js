import { ctx, spriteSheet, level, levelHeight, levelWidth, tileSize, powerUpCount } from "./main.js";

export function createPowerups() {
    // Luo random array tasolle tulevista upeista * powerUpCount
}

////////////////////
// Powerups

export function rangePowerUp(range) {
    return range + 1;
}

export function bombCountPowerUp(maxBombs) {
    return maxBombs + 1;
} 


////////////////////
// Render
export function renderPowerups()
{
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;
            // Hard tiles
            if (level[x][y].hasPowerup) {
                ctx.drawImage(spriteSheet, 0, 128, 32, 32, xCoord, yCoord, tileSize, tileSize);
            }
        }
    }
}
