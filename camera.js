import { ctx, tileSize, scale, levelWidth, canvas, deltaTime } from "./main.js";
import { players } from "./player.js";
import { getTileFromWorldLocation, lerp } from "./utils.js";

let cameraX = 0;
let cameraLt = 0;
let cameraRt = 0;
let cameraPt = 0;
const followCameraSpeed = 0.05;
const edgeCameraSpeed = 0.25; // TODO: Parempi vaihtoehto tälle
export function updateCamera()
{

    if (isNaN(deltaTime))
        return;

    const playerTile = getTileFromWorldLocation(players[0]);
    const playerX = playerTile.x / tileSize;

    // Left edge
    if (playerX <= 6) {
        cameraPt = 0;

        cameraLt += deltaTime * edgeCameraSpeed;
        cameraLt = Math.min(cameraLt, 1);
        const targetX = 0;
        cameraX = lerp(cameraX, targetX, cameraLt);

        ctx.setTransform(scale, 0, 0, scale, cameraX, 0);

    // Right edge
    } else if (playerX >= levelWidth - 6) {
        cameraPt = 0;

        cameraRt += deltaTime * edgeCameraSpeed;
        cameraRt = Math.min(cameraRt, 1);

        const targetX = canvas.width / 2 - scale * (levelWidth - 6.5) * tileSize;
        cameraX = lerp(cameraX, targetX, cameraRt);

        ctx.setTransform(scale, 0, 0, scale, cameraX, 0);

    // Follow camera
    } else {
        cameraLt = 0;
        cameraRt = 0;

        cameraPt += deltaTime * followCameraSpeed;
        cameraPt = Math.min(cameraPt, 1);

        const targetX = canvas.width / 2 - scale * players[0].x;
        cameraX = lerp(cameraX, targetX, cameraPt);

        ctx.setTransform(scale, 0, 0, scale, cameraX, 0);
    }

    //ctx.setTransform(scale, 0, 0, scale, canvas.width/2 - scale * players[0].x, canvas.height/2 - scale * players[0].y);
}
