import { canvas, ctx, tileSize, level, spriteSheet } from "./main.js";
import { levelHeight, levelType, levelWidth, levels } from "./gamestate.js";
import { exitLocation, powerupLocations } from "./tile.js";
import { drawCoordinates, coordsToggle } from "./page.js";

const hardWallTexture = new Image();
const softWallTexture = new Image();
const floorTexture = new Image();


export function setTextures() {
    if (levelType === "forest_day") {
        floorTexture.src = "./assets/grass_01.png";
        hardWallTexture.src = "./assets/stone_brick_04.png"
        softWallTexture.src = "./assets/stone_brick_02.png"
    } 
    else if (levelType === "forest_night") {
        floorTexture.src = "./assets/cobblestone_03.png";
        hardWallTexture.src = "./assets/stone_brick_05.png"
        softWallTexture.src = "./assets/stone_brick_03.png"
    }
    else if (levelType === "hell") {
        floorTexture.src = "./assets/lava_01.png";
        hardWallTexture.src = "./assets/stone_brick_01.png"
        softWallTexture.src = "./assets/stone_brick_03.png"
    } else {
        floorTexture.src = "./assets/cobblestone_03.png";
        hardWallTexture.src = "./assets/stone_brick_05.png"
        softWallTexture.src = "./assets/stone_brick_03.png"
    }
}

export function renderWalls()
{
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;
            // Hard tiles
            if (level[x][y].type === "HardWall") {
                ctx.drawImage(hardWallTexture, 0, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
            }
            // Soft tiles
            else if (level[x][y].type === "SoftWall") {
                ctx.drawImage(softWallTexture, 0, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
            }
        }
    }

    drawCoordinates(coordsToggle);
}


const floorTextureSize = 128;
export function renderFloor()
{
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            ctx.drawImage(floorTexture, 
                          x * floorTextureSize,
                          y * floorTextureSize,
                          floorTextureSize, floorTextureSize);
        }
    }
}

const doorAnimation = new Image();
doorAnimation.src = "./assets/door_animation.png";
export class EntranceAnimation {
    constructor() {
        this.frames = 0;
    }
    
    playAnimation() {
        this.frames = 0;
        this.frameTimer = setInterval(() => {
            this.frames++;

            if (this.frames >= 18) {
                clearInterval(this.frameTimer);
            }
        }, 80);
    }
    
    render() {
        let frameW = tileSize * 3;
        let frameH = tileSize;
        
        ctx.drawImage(doorAnimation, 0, frameH * this.frames, frameW, frameH, 0, tileSize, frameW, frameH);
    }
}

export class ExitAnimation {
    constructor() {
        // The spritesheet goes backwards
        this.frames = 11;
    }

    init() {
        this.frames = 11;
    }
    
    playAnimation() {
        this.frameTimer = setInterval(() => {
            this.frames--;

            if (this.frames <= 6) {
                clearInterval(this.frameTimer);
            }
        }, 300);
    }
    
    render() {
        let frameW = tileSize * 3;
        let frameH = tileSize;
        
        ctx.drawImage(doorAnimation, 0, frameH * this.frames, frameW, frameH, exitLocation.x - tileSize, exitLocation.y, frameW, frameH);
    }
}


export class locBlinkingAnimation {
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

            if (exitLocation.type === "SoftWall") {
                ctx.fillStyle = "rgba(255, 100, 100, 0.2)";
                ctx.fillRect(exitLocation.x, exitLocation.y, tileSize, tileSize);
            }
        }
    }
}