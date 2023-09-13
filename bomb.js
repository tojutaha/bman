import { ctx, level, tileSize, spriteSheet } from "./main.js";
import { player } from "./player.js";
 
let bombs = [];
let explosions = [];
let crumblingWalls = [];

function Bomb(x, y, hasExploded, bombTicks, range) {
    this.x = x || 0;
    this.y = y || 0,
    this.hasExploded = false;
    this.ticks = bombTicks || 4;
    this.range = range || 1;

    let ticking = setInterval(() => {
        this.ticks--;
        if (this.ticks === 0) {
            clearInterval(ticking);
            this.hasExploded = true;
            explode(this);
            bombs.splice(0, 1); // TODO: ehkä?
            explosions.push(this);
            console.log("Bomb exploded:", explosions);
        }
    }, 1000);
}

export function dropBomb() {
    let bombX = Math.round(player.x / tileSize) * tileSize;
    let bombY = Math.round(player.y / tileSize) * tileSize;
    bombs.push(new Bomb(bombX, bombY, false, 1, 2)); // TICKS 1, RANGE 2
}

function getBombSurroundings(x, y, range) {
    let row = x / tileSize;
    let col = y / tileSize;
    let rX = (x + tileSize) / tileSize;
    let lX = (x - tileSize) / tileSize;
    let tY = (y - tileSize) / tileSize;
    let bY = (y + tileSize) / tileSize;
    
    // TODO: joka suunnalle oma array jotta jos seinä tulee vastaan, voidaan tyhjentää array?
    let tiles = [];
    for (let i = 0; i < range; i++) {
        let right = rX + i;
        let top = tY - i;
        let left = lX - i;
        let bottom = bY + i;

        if (top > 0) {
            tiles.push(level[row][tY-i]);
        }
        if (left > 0) {
            tiles.push(level[lX-i][col]);
        }
        if (right < 25) {
            tiles.push(level[right][col]);
        }
        if (bottom < 25) {
            tiles.push(level[row][bY+i]);
        }
    }
    return tiles;
}

function explode(bomb) {
    let tiles = getBombSurroundings(bomb.x, bomb.y, bomb.range);

    tiles.forEach(tile => {
        if (tile.type === "DestructibleWall") {
            destroyWall(tile);
        }
    });
}

function destroyWall(tile){
    tile.type = "Floor";
    tile.isWalkable = true;
    
    // ALKUPERÄINEN
    tile.crumbleFrames = 3;
    crumblingWalls.push(tile);
    let crumbling = setInterval(() => {
        tile.crumbleFrames--;
        if (tile.crumbleFrames === 0) {
            clearInterval(crumbling);
        }
    }, 500);
}

////////////////////
// Render
export function renderBombs() {
    if (bombs.length > 0) {
        bombs.forEach((bomb, index) => {
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
        });
    }
}

export function renderExplosions() {
    if (crumblingWalls.length > 0) {
        crumblingWalls.forEach((wall, index) => {
            if (wall.crumbleFrames === 3) {
                ctx.clearRect(wall.y, wall.x, tileSize, tileSize);
                ctx.drawImage(spriteSheet, 64, 0, 32, 32, wall.y, wall.x, tileSize, tileSize);
            }
            else if (wall.crumbleFrames === 2) {
                ctx.drawImage(spriteSheet, 96, 0, 32, 32, wall.y, wall.x, tileSize, tileSize);
            }
            else if (wall.crumbleFrames === 1) {
                ctx.drawImage(spriteSheet, 128, 0, 32, 32, wall.y, wall.x, tileSize, tileSize);
            }
            else {
                crumblingWalls.splice(index, 1); // TODO: tee jossain muualla kun renderissä
            }
        })
    }
}