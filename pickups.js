import { ctx, isMultiplayer, level, tileSize } from "./main.js";
import { levelHeight, levelWidth } from "./gamestate.js";
import { spriteSheets } from "./spritesheets.js";
import { createFloatingText } from "./particles.js";
import { clamp } from "./utils.js";
import { playAudio, sfxs } from "./audio.js";
import { shroom, shroomTrigger } from "./animations.js";

////////////////////
// Powerups
export class Powerup
{
    constructor() {
        this.maxBombs = 1;
        this.maxRange = 1;
        this.currentWalls = 3;
        this.maxWalls = 3;
        this.blinker = null;
        this.maxSpeed = 250;
        this.extraSpeed = 15;
    }

    pickup(tile, player) {
        tile.hasPowerup = false;
        initPickups();
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
            createFloatingText({x: tile.x, y: tile.y}, "+ Speed");
        }

        else if (tile.powerup === "material") {
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
// Mushrooms
export function pickupMushroom(tile, player) {
    if (shroomTrigger) return;
    
    tile.hasMushroom = false;
    initPickups();
    playAudio(sfxs['MUSHROOM']);

    // Trigger shroom animation
    shroom(player);
}

////////////////////
// Renders
let pickupsCanvas = document.createElement('canvas');
let pickupsCtx = pickupsCanvas.getContext('2d');

const powerupImage = new Image();
const mushroomImage = new Image();
export function initPickups()
{
    pickupsCanvas.width = levelWidth * tileSize;
    pickupsCanvas.height = levelHeight * tileSize;
    pickupsCtx.clearRect(0, 0, pickupsCanvas.width, pickupsCanvas.height);
    
    if (!powerupImage.src) {
        powerupImage.src = spriteSheets.powerups;
    }

    if (!mushroomImage.src) {
        mushroomImage.src = spriteSheets.mushroom;
    }

    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;
            const currentTile = level[x][y];

            if (currentTile.hasPowerup) {
                if (currentTile.powerup === "bomb") {
                    pickupsCtx.drawImage(powerupImage, 0, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
                else if (currentTile.powerup === "range") {
                    pickupsCtx.drawImage(powerupImage, tileSize, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
                else if (currentTile.powerup === "speed") {
                    pickupsCtx.drawImage(powerupImage, tileSize*2, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
                else if (currentTile.powerup === "material") {
                    pickupsCtx.drawImage(powerupImage, tileSize*3, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                }
            }

            if (currentTile.hasMushroom) {
                pickupsCtx.drawImage(mushroomImage, 0, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
            }
        }
    }
}

export function renderPickups()
{
    ctx.drawImage(pickupsCanvas, 0, 0);
}