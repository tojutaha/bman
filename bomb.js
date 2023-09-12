import { ctx, level, tileSize, spriteSheet } from "./main.js";
import { player } from "./player.js";
 
export function dropBomb() {
    let bombX = Math.round(player.x / 32) * 32;
    let bombY = Math.round(player.y / 32) * 32;
    console.log(bombX, bombY, "bomb");
    console.log(player.x, player.y, "player");

    return bombX, bombY;
}

////////////////////
// Render
export function renderBombs() {
    let bX = 32*2;
    let bY = 32*1;
    ctx.drawImage(spriteSheet, 0, 32, 32, 32, bX, bY, tileSize, tileSize);
}