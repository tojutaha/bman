import { ctx, tileSize, scale, levelWidth, canvas } from "./main.js";
import { players } from "./player.js";
import { getTileFromWorldLocation, lerp } from "./utils.js";

let cameraX = 0;
export function updateCamera()
{
    const playerTile = getTileFromWorldLocation(players[0]);
    const playerX = playerTile.x / tileSize;


    // TODO: Smooth transition?!
    if (playerX <= 6) {
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
    } else if (playerX >= levelWidth - 6) {
        ctx.setTransform(scale, 0, 0, scale, canvas.width / 2 - scale * (levelWidth - 6) * tileSize, 0);
    } else {
        ctx.setTransform(scale, 0, 0, scale, canvas.width / 2 - scale * players[0].x, 0);
    }

    //ctx.setTransform(scale, 0, 0, scale, canvas.width/2 - scale * players[0].x, canvas.height/2 - scale * players[0].y);
}
