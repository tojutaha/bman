import { ctx, level, tileSize, spriteSheet } from "./main.js";
import { player } from "./player.js";
 
function Bomb(x, y, hasExploded, bombTicks) {
    this.x = x || 0;
    this.y = y || 0,
    this.hasExploded = this.hasExploded || false;
    this.ticks = bombTicks || 4;

    let ticking = setInterval(() => {
        this.ticks--;
        if (this.ticks === 0) {
            clearInterval(ticking);
            hasExploded = true;
        }
    }, 1000);
}

let bombs = [];

export function dropBomb() {
    let bombX = Math.round(player.x / 32) * 32;
    let bombY = Math.round(player.y / 32) * 32;
    bombs.push(new Bomb(bombX, bombY));
}

////////////////////
// Render
export function renderBombs() {
    if (bombs.length > 0) {
        bombs.forEach(bomb => {
            if (bomb.ticks === 4) {
                ctx.drawImage(spriteSheet, 0, 32, 32, 32, bomb.x, bomb.y, tileSize, tileSize);
            }
            else if (bomb.ticks === 3) {
                ctx.drawImage(spriteSheet, 32, 32, 32, 32, bomb.x, bomb.y, tileSize, tileSize);
            }
            else if (bomb.ticks === 2) {
                ctx.drawImage(spriteSheet, 64, 32, 32, 32, bomb.x, bomb.y, tileSize, tileSize);
            }
            else if (bomb.ticks === 1) {
                ctx.drawImage(spriteSheet, 96, 32, 32, 32, bomb.x, bomb.y, tileSize, tileSize);
            }
            else {
                ctx.drawImage(spriteSheet, 128, 32, 32, 32, bomb.x, bomb.y, tileSize, tileSize);
            }
        });
    }
}