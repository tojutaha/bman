import { ctx, level, spriteSheet, tileSize } from "./main.js";
import { levelHeight, levelWidth } from "./gamestate.js";
import { spriteSheets } from "./spritesheets.js";

export class Powerup
{
    constructor() {
        this.maxBombs = 1;
        this.maxRange = 1; 
        this.blinker = null;
    }

    pickup(tile, player) {
        tile.hasPowerup = false;

        if (tile.powerup === "bomb") {
            this.maxBombs += 1;
        }
        else if (tile.powerup === "range") {
            this.maxRange += 1;
        }

        else if (tile.powerup === "speed") {
            player.speed += 40;
        }
    }
}

export const powerupChoices = ["bomb", "range", "speed"];

export function randomPowerup() {
    return powerupChoices[Math.floor(Math.random() * powerupChoices.length)];
}

////////////////////
// Renders
const powerupImage = new Image();
export function renderPowerups()
{
    if (!powerupImage.src) {
        powerupImage.src = spriteSheets.powerups;
    }

    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;
            const currentTile = level[x][y];

            if (currentTile.hasPowerup) {
                if (currentTile.powerup === "bomb") {
                    ctx.drawImage(powerupImage, 0, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
                else if (currentTile.powerup === "range") {
                    ctx.drawImage(powerupImage, tileSize, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
                else if (currentTile.powerup === "speed") {
                    ctx.drawImage(powerupImage, tileSize*2, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
            }
        }
    }
}