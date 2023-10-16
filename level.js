import { canvas, ctx, tileSize, levelHeight, levelWidth, level, spriteSheet, game } from "./main.js";
import { exitLocation } from "./tile.js";
import { drawCoordinates, coordsToggle } from "./page.js";

const hardWallTexture = new Image();
hardWallTexture.src = "./assets/stone_brick_05.png"
const softWallTexture = new Image();
softWallTexture.src = "./assets/stone_brick_03.png"
export function renderWalls()
{
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;
            // Hard tiles
            if (level[x][y].type === "HardWall") {
                //ctx.drawImage(spriteSheet, 0, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                ctx.drawImage(hardWallTexture, 0, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
            }
            // Soft tiles
            else if (level[x][y].type === "SoftWall") {
                //ctx.drawImage(spriteSheet, tileSize, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
                ctx.drawImage(softWallTexture, 0, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
            }
        }
    }

    drawCoordinates(coordsToggle);
}

const floorTexture = new Image();
floorTexture.src = "./assets/cobblestone_03.png";
//floorTexture.src = "./assets/grass_01.png";
// Suurempi arvo kuin tileSize peittää näkyvän toistamisen paremmin.
const floorTextureSize = 128;
export function renderFloor()
{
    // TODO: oisko tämä parempi renderöidä html/css kanssa?
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            ctx.drawImage(floorTexture, 
                          x * floorTextureSize,
                          y * floorTextureSize,
                          floorTextureSize, floorTextureSize);
        }
    }

    //ctx.fillStyle = "#4192c3";
    //ctx.fillRect(0, 0, levelWidth*tileSize, levelHeight*tileSize);

    // Yksi kerrallaan:
    // for (let x = 0; x < levelWidth; x++) {
    //     for (let y = 0; y < levelHeight; y++) {
    //         const xCoord = x * tileSize;
    //         const yCoord = y * tileSize;

    //         if (level[x][y].type === "Floor") {
    //             ctx.fillStyle = "#4192c3";
    //             ctx.fillRect(xCoord, yCoord, tileSize, tileSize);
    //         }
    //     }
    // }
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
        }, 80);
    }
    
    render() {
        let frameW = tileSize * 3;
        let frameH = tileSize;
        
        ctx.drawImage(doorAnimation, 0, frameH * this.frames, frameW, frameH, exitLocation.x - tileSize, exitLocation.y, frameW, frameH);
    }
}


export class LevelHeaderAnimation {
    constructor() {
        this.visible = true;
        this.frames = 0;
        this.alpha = 0.95;
    }
    
    playAnimation() {
        this.visible = true;
        this.frames = 0;
        this.alpha = 0.95;

        setTimeout(() => {
            this.frameTimer = setInterval(() => {
                this.frames++;
    
                if (this.frames >= 7) {
                    setTimeout(() => {
                        this.fadeOut();
                    }, 2000);
                    clearInterval(this.frameTimer);
                }
            }, 100);
        }, 500);
    }

    fadeOut() {
        this.fadeOutTimer = setInterval(() => {
            this.alpha -= 0.05;

            if (this.alpha <= 0.0) {
                clearInterval(this.fadeOutTimer);
            }
        }, 10);
    }
    
    render() {
        if (this.visible) {
            ctx.fillStyle = `rgba(240, 240, 240, ${this.alpha})`;
            ctx.strokeStyle = `rgba(30, 30, 30, ${this.alpha})`;
            
            ctx.lineWidth = 20;
            ctx.font = "100px Minimal";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (this.frames === 1) {
                ctx.strokeText("L", canvas.width / 2, canvas.width / 2);
                ctx.fillText("L", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 2) {
                ctx.strokeText("LE", canvas.width / 2, canvas.width / 2);
                ctx.fillText("LE", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 3) {
                ctx.strokeText("LEV", canvas.width / 2, canvas.width / 2);
                ctx.fillText("LEV", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 4) {
                ctx.strokeText("LEVE", canvas.width / 2, canvas.width / 2);
                ctx.fillText("LEVE", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 5) {
                ctx.strokeText("LEVEL", canvas.width / 2, canvas.width / 2);
                ctx.fillText("LEVEL", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 6) {
                ctx.strokeText("LEVEL ", canvas.width / 2, canvas.width / 2);
                ctx.fillText("LEVEL ", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames >= 7) {
                ctx.strokeText("LEVEL " + game.level, canvas.width / 2, canvas.width / 2);
                ctx.fillText("LEVEL " + game.level, canvas.width / 2, canvas.width / 2);
            }
        }
    }
}
