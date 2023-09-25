import { ctx, spriteSheet, level, levelHeight, levelWidth, tileSize, powerUpCount } from "./main.js";

export class Powerup
{
    constructor() {
        this.maxBombs = 5; // HUOM
        this.maxRange = 1;
        this.currentTicks = 4;
    }

    pickup(tile, player) {
        tile.hasPowerup = false;

        if (tile.powerup === "ExtraBomb") {
            this.maxBombs += 1;
        }
        else if (tile.powerup === "ExtraRange") {
            this.maxRange += 1;
        }

        else if (tile.powerup === "ExtraSpeed") {
            player.speed += 0.5;
        }

    }
}

export const powerups = ["ExtraBomb", "ExtraRange", "ExtraSpeed"];

export function randomPowerup() {
    return powerups[Math.floor(Math.random() * powerups.length)];
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
