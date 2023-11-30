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
let cameraT = 0;
const followCameraSpeed = 0.5;
const edgeCameraSpeed = 0.25;

let targetOffset;
let edgeOffset;

export function updateCamera() {    // TODO: välillä napsahtelee kun kävelee kulmissa
    const playerTile = getTileFromWorldLocation(players[0]);
    const playerX = playerTile.x / tileSize;
    const playerY = playerTile.y / tileSize;
    let targetX;
    let targetY;

    // Left edge
    if (playerX <= edgeOffset) {
        // console.log('left');
        cameraPt = 0;

        cameraLt = getEdgeCameraT(cameraLt);
        cameraT = cameraLt;

        targetX = 0;
        targetY = getTargetY(playerY);

    // Right edge
    } else if (playerX >= levelWidth - edgeOffset) {
        // console.log('right');
        cameraPt = 0;

        cameraRt = getEdgeCameraT(cameraRt);
        cameraT = cameraRt;

        targetX = canvas.width / 2 - scale * (levelWidth - targetOffset) * tileSize;
        targetY = getTargetY(playerY);

    // Top edge
    } else if (playerY <= edgeOffset) {
        // console.log('top');
        cameraPt = 0;

        cameraTt += deltaTime * edgeCameraSpeed;
        cameraTt = Math.min(cameraTt, 1);
        cameraT = cameraTt;

        targetX = canvas.width / 2 - scale * players[0].x;
        targetY = 0;

    // Bottom edge
    } else if (playerY >= levelHeight - edgeOffset) {
        // console.log('bot');
        cameraPt = 0;

        cameraBt = getEdgeCameraT(cameraBt);
        cameraT = cameraBt;

        targetX = canvas.width / 2 - scale * players[0].x;
        targetY = getTargetY(playerY);
    
    // // Follow camera
    } else {
        // console.log('follow');
        cameraLt = 0;
        cameraRt = 0;
        cameraTt = 0;
        cameraBt = 0;

        cameraPt += deltaTime * followCameraSpeed;
        cameraPt = Math.min(cameraPt, 1);
        cameraT = cameraPt;

        targetX = canvas.width / 2 - scale * players[0].x;
        targetY = getTargetY(playerY);
    }

    // Lerp and transform
    cameraX = lerp(cameraX, targetX, cameraT);
    cameraY = lerp(cameraY, targetY, cameraT);
    ctx.setTransform(scale, 0, 0, scale, cameraX, cameraY);
}

function getEdgeCameraT(t) {
    t += deltaTime * edgeCameraSpeed;
    return Math.min(t, 1);
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
        targetOffset = 4;
        edgeOffset = 4;
    } else {
        console.info("camera: normal offsets");
        targetOffset = 6.5;
        edgeOffset = 6;
    }
}