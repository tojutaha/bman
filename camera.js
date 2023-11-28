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
    if (playerX <= edgeOffset && playerY <= edgeOffset) {
        cameraPt = 0;

        cameraLt += deltaTime * edgeCameraSpeed;
        cameraLt = Math.min(cameraLt, 1);

        const targetX = 0;
        cameraX = lerp(cameraX, targetX, cameraLt);

        ctx.setTransform(scale, 0, 0, scale, cameraX, 0);

    // Right edge
    } else if (playerX >= levelWidth - edgeOffset) {
        cameraPt = 0;

        cameraRt += deltaTime * edgeCameraSpeed;
        cameraRt = Math.min(cameraRt, 1);

        const targetX = canvas.width / 2 - scale * (levelWidth - targetOffset) * tileSize;
        cameraX = lerp(cameraX, targetX, cameraRt);

        ctx.setTransform(scale, 0, 0, scale, cameraX, playerY);

    // // Top edge
    // } else if (playerY <= edgeOffset) {
    //     cameraPt = 0;

    //     cameraTt += deltaTime * edgeCameraSpeed;
    //     cameraTt = Math.min(cameraTt, 1);

    //     const targetY = 0;
    //     cameraY = lerp(cameraY, targetY, cameraTt);

    //     ctx.setTransform(scale, 0, 0, scale, cameraX, cameraY);

    // // Bottom edge
    // } else if (playerY >= levelHeight - edgeOffset) {
    //     cameraPt = 0;

    //     cameraBt += deltaTime * edgeCameraSpeed;
    //     cameraBt = Math.min(cameraBt, 1);

    //     const targetY = canvas.height - scale * tileSize * (levelHeight + 1) - edgeOffset * scale * tileSize;
    //     cameraY = lerp(cameraY, targetY, cameraBt);

    //     ctx.setTransform(scale, 0, 0, scale, cameraX, cameraY);

    // Follow camera
    } else {
        cameraLt = 0;
        cameraRt = 0;
        cameraTt = 0;
        cameraBt = 0;

        cameraPt += deltaTime * followCameraSpeed;
        cameraPt = Math.min(cameraPt, 1);

        const targetX = canvas.width / 2 - scale * players[0].x;
        const targetY = canvas.height / 2 - scale * players[0].y;
        
        // TODO: näiden säätöä
        if (playerX >= targetOffset) {
            cameraX = lerp(cameraX, targetX, cameraPt);
        }
        if (playerY >= targetOffset && isMobile) {  //isMobile pois
            cameraY = lerp(cameraY, targetY, cameraPt);
        }

        ctx.setTransform(scale, 0, 0, scale, cameraX, 0);
    }
}

export function setCameraOffsets() {
    if (isMobile) {
        console.info("camera: mobile offsets");
        targetOffset = 3.5;
        edgeOffset = 2;
    } else {
        console.info("camera: normal offsets");
        targetOffset = 6.5;
        edgeOffset = 6;
    }
}