import { levelHeight, levelWidth, powerUpCount } from "./main";

// TODO: Virheilee jos exporttaa täältä mainiin
export function createPowerups(level) {
    let chosenTiles = [];

    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            if (level[x][y].type === "DestructibleWall") {
                if (chosenTiles.length < powerUpCount) {
                    let random = Math.random();

                    if (random < 0.2) {
                        level[x][y].hasPowerup = true;
                        chosenTiles.push(level[x][y]);
                        console.log("Added a powerup to", level[x][y].x, level[x][y].y);
                    }
                }
            }
        }
    }
    return chosenTiles;
}

export function rangePowerUp(range) {
    return range + 1;
}

export function bombCountPowerUp(maxBombs) {
    return maxBombs + 1;
} 