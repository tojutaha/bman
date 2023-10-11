import { canvas, ctx, tileSize, levelHeight, levelWidth, level, spriteSheet, game } from "./main.js";
import { exitLocation } from "./tile.js";
import { drawCoordinates, coordsToggle } from "./page.js";

export function renderWalls()
{
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;
            // Hard tiles
            if (level[x][y].type === "HardWall") {
                ctx.drawImage(spriteSheet, 0, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
            }
            // Soft tiles
            else if (level[x][y].type === "SoftWall") {
                ctx.drawImage(spriteSheet, tileSize, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
            }
        }
    }

    drawCoordinates(coordsToggle);
}

const floorTexture = new Image();
//floorTexture.src = "./assets/cobblestone_01.png";
floorTexture.src = "./assets/cobblestone_02.png";
//floorTexture.src = "./assets/grass_01.png";
//floorTexture.src = "./assets/grass_02.png";
// Suurempi arvo kuin tileSize peittää näkyvän toistamisen paremmin.
const textureSize = 64;
export function renderFloor()
{
    // TODO: oisko tämä parempi renderöidä html/css kanssa?
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            ctx.drawImage(floorTexture, 
                          x * textureSize,
                          y * textureSize,
                          textureSize, textureSize);
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

export function renderExit()
{
    if (exitLocation.isOpen)
    {
        ctx.drawImage(spriteSheet, tileSize, tileSize*5, tileSize, tileSize, exitLocation.x, exitLocation.y, tileSize, tileSize);
    }
    else {
        ctx.drawImage(spriteSheet, 0, tileSize*5, tileSize, tileSize, exitLocation.x, exitLocation.y, tileSize, tileSize);
    }
}


export class LevelHeaderAnimation {
    constructor() {
        this.visible = true;
        this.frames = 0;
        this.alpha = 0.95;
    }
    
    start() {
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
