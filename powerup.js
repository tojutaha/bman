import { ctx, isMultiplayer, level, tileSize } from "./main.js";
import { levelHeight, levelWidth } from "./gamestate.js";
import { spriteSheets } from "./spritesheets.js";
import { createFloatingText } from "./particles.js";
import { clamp } from "./utils.js";
import { playAudio, sfxs } from "./audio.js";

export class Powerup
{
    constructor() {
        this.maxBombs = 1;
        this.maxRange = 1;
        this.currentWalls = 3;
        this.maxWalls = 3;
        this.blinker = null;
        // TODO: Mikä on sopiva max speed?
        this.maxSpeed = 200;
        this.extraSpeed = 20;
    }

    pickup(tile, player) {
        tile.hasPowerup = false;
        initPowerups();
        playAudio(sfxs['POWERUP3']);

        if (tile.powerup === "bomb") {
            this.maxBombs += 1;
            createFloatingText({x: tile.x, y: tile.y}, "+1 Bomb");
        }
        else if (tile.powerup === "range") {
            this.maxRange += 1;
            createFloatingText({x: tile.x, y: tile.y}, "+1 Range");
        }

        else if (tile.powerup === "speed") {
            player.speed = clamp(player.speed += this.extraSpeed, 0, this.maxSpeed);
            createFloatingText({x: tile.x, y: tile.y}, "+Speed");
        }

        else if (tile.powerup === "material") {
            // TODO: Montako halutaan per stack?
            this.currentWalls += 3;
            createFloatingText({x: tile.x, y: tile.y}, `+3 Materials`);
        }
    }

    reset() {
        this.maxBombs = 1;
        this.maxRange = 1;
        this.currentWalls = 3;
        this.maxWalls = 3;
    }
}

export const powerupChoices = ["bomb", "range", "speed", "material"];

export function randomPowerup() {
    if(isMultiplayer) {
        return powerupChoices[Math.floor(Math.random() * powerupChoices.length)];
    } else {
        return powerupChoices[Math.floor(Math.random() * powerupChoices.length - 1)];
    }
}

////////////////////
// Renders
let powerupsCanvas = document.createElement('canvas');
let powerupsCtx = powerupsCanvas.getContext('2d');

const powerupImage = new Image();
export function initPowerups()
{
    powerupsCanvas.width = levelWidth * tileSize;
    powerupsCanvas.height = levelHeight * tileSize;
    powerupsCtx.clearRect(0, 0, powerupsCanvas.width, powerupsCanvas.height);
    
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
                    powerupsCtx.drawImage(powerupImage, 0, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
                else if (currentTile.powerup === "range") {
                    powerupsCtx.drawImage(powerupImage, tileSize, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
                else if (currentTile.powerup === "speed") {
                    powerupsCtx.drawImage(powerupImage, tileSize*2, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
                else if (currentTile.powerup === "material") {
                    powerupsCtx.drawImage(powerupImage, tileSize*3, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
            }
        }
    }
}

export function renderPowerups()
{
    ctx.drawImage(powerupsCanvas, 0, 0);
}