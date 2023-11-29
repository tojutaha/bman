import { ctx, tileSize, scale, canvas, deltaTime } from "./main.js";
import { levelHeight, levelWidth } from "./gamestate.js";
import { players } from "./player.js";
import { getTileFromWorldLocation, lerp } from "./utils.js";
import { isMobile } from "./mobile.js";

export let cameraX = 0;
export let cameraY = 0;

export function setCameraX(value) {
    cameraX = value;
}

export function setCameraY(value) {
    cameraY = value;
}

let cameraLt = 0;
let cameraRt = 0;
let cameraPt = 0;
let cameraTt = 0;
let cameraBt = 0;
const followCameraSpeed = 0.05;
const edgeCameraSpeed = 0.25;

let targetOffset;
let edgeOffset;

export function updateCamera() {
    const playerTile = getTileFromWorldLocation(players[0]);
    const playerX = playerTile.x / tileSize;
    const playerY = playerTile.y / tileSize;

    // Left edge
    if (playerX <= edgeOffset) {
        cameraPt = 0;

        cameraLt += deltaTime * edgeCameraSpeed;
        cameraLt = Math.min(cameraLt, 1);

        const targetX = 0;
        cameraX = lerp(cameraX, targetX, cameraLt);
        const targetY = getTargetY(playerY);
        cameraY = lerp(cameraY, targetY, cameraLt);

        ctx.setTransform(scale, 0, 0, scale, cameraX, cameraY);

    // Right edge
    } else if (playerX >= levelWidth - edgeOffset) {
        cameraPt = 0;

        cameraRt += deltaTime * edgeCameraSpeed;
        cameraRt = Math.min(cameraRt, 1);

        const targetX = canvas.width / 2 - scale * (levelWidth - targetOffset) * tileSize;
        cameraX = lerp(cameraX, targetX, cameraRt);
        const targetY = getTargetY(playerY);
        cameraY = lerp(cameraY, targetY, cameraRt);

        ctx.setTransform(scale, 0, 0, scale, cameraX, cameraY);
    
    // TODO: lerp top bot
    
    // Follow camera
    } else {
        cameraLt = 0;
        cameraRt = 0;
        cameraTt = 0;
        cameraBt = 0;

        cameraPt += deltaTime * followCameraSpeed;
        cameraPt = Math.min(cameraPt, 1);

        const targetX = canvas.width / 2 - scale * players[0].x;
        const targetY = getTargetY(playerY);
        
        if (playerX >= targetOffset) {
            cameraX = lerp(cameraX, targetX, cameraPt);
        }
        if (playerY >= targetOffset) {
            cameraY = lerp(cameraY, targetY, cameraPt);
        }

        ctx.setTransform(scale, 0, 0, scale, cameraX, cameraY);
    }
}

function getTargetY(playerY) {
    let targetY;
    // Top edge
    if (playerY <= edgeOffset) { 
        targetY = 0;
    } 
    // Bottom edge
    else if (playerY >= levelHeight - edgeOffset) { 
        targetY = canvas.width / 2 - scale * (levelHeight - targetOffset) * tileSize;
    } else {
        targetY = canvas.height / 2 - scale * players[0].y;
    }

    return targetY;
}

export function setCameraOffsets() {
    if (isMobile) {
        console.info("camera: mobile offsets");
        targetOffset = 3;
        edgeOffset = 3;
    } else {
        console.info("camera: normal offsets");
        targetOffset = 6.5;
        edgeOffset = 6;
    }
}