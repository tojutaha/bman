import { ctx, spriteSheet, level, tileSize } from "./main.js";
import { levelHeight, levelWidth } from "./gamestate.js";
import { powerupLocations } from "./tile.js";


export class Powerup
{
    constructor() {
        this.maxBombs = 1;
        this.maxRange = 1; 
        this.currentTicks = 4;
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
// Render
export function renderPowerups()
{
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;
            const currentTile = level[x][y];

            if (currentTile.hasPowerup) {
                if (currentTile.powerup === "bomb") {
                    ctx.drawImage(spriteSheet, 0, tileSize*4, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
                else if (currentTile.powerup === "range") {
                    ctx.drawImage(spriteSheet, tileSize, tileSize*4, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
                else if (currentTile.powerup === "speed") {
                    ctx.drawImage(spriteSheet, tileSize*2, tileSize*4, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
            }
        }
    }
}


export class powerupAnimation {
    constructor() {
        this.showLocation = false;
        this.isBlinking = false;
    }

    // Blink the location overlays of powerups
    startBlinking() {
        this.isBlinking = true;
        this.blinker = setInterval(() => {
            this.showLocation = !this.showLocation;

            if (!this.isBlinking) {
                clearInterval(blinker);
            }
        }, 700);
    }

    render() {
        powerupLocations.forEach(tile => {
            if (tile.hasPowerup) {
                if (tile.powerup === "bomb") {
                    ctx.drawImage(spriteSheet, 0, tileSize*4, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
                }
                else if (tile.powerup === "range") {
                    ctx.drawImage(spriteSheet, tileSize, tileSize*4, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
                }
                else if (tile.powerup === "speed") {
                    ctx.drawImage(spriteSheet, tileSize*2, tileSize*4, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
                }
            }
        });
    }

    renderLocationOverlay() {
        if (this.showLocation) {
            powerupLocations.forEach(tile => {
                if (tile.type === "SoftWall") {
                    ctx.fillStyle = "rgba(255, 190, 130, 0.3)";
                    ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
                }
            });
        }
    }
}
