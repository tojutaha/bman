import { ctx, tileSize, level } from "./main.js";
import { levelHeight, levelType, levelWidth } from "./gamestate.js";
import { drawCoordinates, coordsToggle } from "./page.js";
import { cameraX } from "./camera.js";

let hardWallTexture = new Image();
let softWallTexture = new Image();
let floor = document.querySelector('.floor');

async function preLoadTextures() {
    const textures = {
        "forest_day": {
            floor:    "./assets/grass_01.png",
            hardWall: "./assets/stone_brick_04.png",
            softWall: "./assets/stone_brick_02.png"
        },
        "forest_night": {
            floor:    "./assets/cobblestone_03.png",
            hardWall: "./assets/stone_brick_05.png",
            softWall: "./assets/stone_brick_03.png"
        },
        "hell": {
            floor:    "./assets/lava_01.png",
            hardWall: "./assets/stone_brick_01.png",
            softWall: "./assets/stone_brick_03.png"
        },
        "default": {
            floor:    "./assets/cobblestone_03.png",
            hardWall: "./assets/stone_brick_05.png",
            softWall: "./assets/stone_brick_03.png"
        }
    };

    let promises = [];
    for(let levelType in textures) {
        for(let textureType in textures[levelType]) {
            promises.push(new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = textures[levelType][textureType];
                textures[levelType][textureType] = img;
            }));
        }
    }

    return Promise.all(promises).then(() => textures);
}

let levelTextures = [];
export async function loadTextures() {
    try {
        levelTextures = await preLoadTextures();
    } catch(error) {
        console.error(`Error loading textures: ${error}`);
    }
}

export function setTextures() {
    floor.style.backgroundImage = `url(${levelTextures[levelType].floor.src})`;
    hardWallTexture = levelTextures[levelType].hardWall;
    softWallTexture = levelTextures[levelType].softWall;
}

let hardWallsCanvas = document.createElement('canvas');
let hardWallsCtx = hardWallsCanvas.getContext('2d');

export function initHardWallsCanvas() {

    hardWallsCtx.clearRect(0, 0, hardWallsCanvas.width, hardWallsCanvas.height);
    hardWallsCanvas.width = levelWidth * tileSize;
    hardWallsCanvas.height = levelHeight * tileSize;

    for(let x = 0; x < levelWidth; x++) {
        for(let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;

            if (level[x][y].type === "HardWall") {
                hardWallsCtx.drawImage(hardWallTexture, 
                              0, 0, tileSize, tileSize, 
                              xCoord, yCoord, tileSize, tileSize);
            }
        }
    }
}

export function renderWalls()
{
    // Hard tiles
    ctx.drawImage(hardWallsCanvas, 0, 0);

    // Soft tiles
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            const xCoord = x * tileSize;
            const yCoord = y * tileSize;

            if (level[x][y].type === "SoftWall") {
                ctx.drawImage(softWallTexture, 0, 0, tileSize, tileSize, xCoord, yCoord, tileSize, tileSize);
            }
        }
    }

    drawCoordinates(coordsToggle);
}

export function renderFloor()
{
    floor.style.backgroundPosition = cameraX + 'px ' + 0 + 'px';
}
