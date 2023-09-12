// Katotaan mitä noista tarvii
import { canvas, ctx, level, levelHeight, levelWidth, playerSize, tileSize, spriteSheet} from "./main.js";
import { player } from "./player.js";
 
export function dropBomb() {
    let bombX = Math.round(player.x / 32) * 32;
    let bombY = Math.round(player.y / 32) * 32;
    console.log(bombX, bombY, "bomb");
    console.log(player.x, player.y, "player");
}