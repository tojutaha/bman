import { ctx, tileSize, scale, canvas, fixedDeltaTime } from "./main.js";
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
const edgeCameraSpeed = 2;

let targetOffset;
let edgeOffset;

export function setCameraOffsets() {
    if (isMobile) {
        targetOffset = 4;
        edgeOffset = 4;
    } else {
        targetOffset = 6.5;
        edgeOffset = 6;
    }
}

export function updateCamera() {
    const playerTile = getTileFromWorldLocation(players[0]);
    const playerX = playerTile.x / tileSize;
    const playerY = playerTile.y / tileSize;

    // Left edge
    if (playerX <= edgeOffset) {
        cameraLt = getEdgeCameraT(cameraLt);
        cameraT = cameraLt;

    // Right edge
    } else if (playerX >= levelWidth - edgeOffset) {
        cameraRt = getEdgeCameraT(cameraRt);
        cameraT = cameraRt;

    // Top edge
    } else if (playerY <= edgeOffset) {
        cameraTt = getEdgeCameraT(cameraTt);
        cameraT = cameraTt;

    // Bottom edge
    } else if (playerY >= levelHeight - edgeOffset) {
        cameraBt = getEdgeCameraT(cameraBt);
        cameraT = cameraBt;

    // Follow camera
    } else {
        cameraPt += fixedDeltaTime * followCameraSpeed;
        cameraPt = Math.min(cameraPt, 1);
        cameraT = cameraPt;
    }

    // Lerp and transform
    const targetX = getTargetX(playerX);
    const targetY = getTargetY(playerY);
    cameraX = lerp(cameraX, targetX, cameraT);
    cameraY = lerp(cameraY, targetY, cameraT);
    ctx.setTransform(scale, 0, 0, scale, cameraX, cameraY);
}

// Reset all other t's to 0 except the one given as parameter
function resetOtherTs(t) {
    cameraLt = t === 'Lt' ? cameraLt : 0;
    cameraRt = t === 'Rt' ? cameraRt : 0;
    cameraPt = t === 'Pt' ? cameraPt : 0;
    cameraTt = t === 'Tt' ? cameraTt : 0;
    cameraBt = t === 'Bt' ? cameraBt : 0;
}

function getEdgeCameraT(t) {
    t += fixedDeltaTime * edgeCameraSpeed;
    return Math.min(t, 1);
}

function getTargetX(playerX) {
    let targetX;
    // Right edge
    if (playerX <= edgeOffset) {
        targetX = 0;
        resetOtherTs('Rt');

    // Left edge
    } else if (playerX >= levelWidth - edgeOffset) {
        targetX = canvas.width / 2 - scale * (levelWidth - targetOffset) * tileSize;
        resetOtherTs('Lt');

    // Follow
    } else {
        targetX = canvas.width / 2 - scale * players[0].x;
        resetOtherTs('Pt');
    }
    return targetX;
}

function getTargetY(playerY) {
    let targetY;
    // Top edge
    if (playerY <= edgeOffset) { 
        targetY = 0;
        resetOtherTs('Tt');

    // Bottom edge
    } else if (playerY >= levelHeight - edgeOffset) { 
        targetY = canvas.height / 2 - scale * (levelHeight - targetOffset) * tileSize;
        resetOtherTs('Bt');
        
    // Follow
    } else {
        targetY = canvas.height / 2 - scale * players[0].y;
        resetOtherTs('Pt');
    }
    return targetY;
}