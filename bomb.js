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
            explode(x, y);
            bombs.splice(0, 1); // TODO: ehkä?
            explosions.push(this);
            console.log("Bomb exploded:", explosions);
        }
    }, 1000);
}

export function dropBomb() {
    let bombX = Math.round(player.x / tileSize) * tileSize;
    let bombY = Math.round(player.y / tileSize) * tileSize;
    bombs.push(new Bomb(bombX, bombY, false, 1)); // TICKS SET TO 1
}

function explode(x, y) {
    let row = x / tileSize;
    let col = y / tileSize;
    let rY = (x + tileSize) / tileSize;
    let lY = (x - tileSize) / tileSize;
    let tY = (y - tileSize) / tileSize;
    let bY = (y + tileSize) / tileSize;
    
    let rightTile = level[rY][col]; // TODO: Täälläkin on x, y väärinpäin
    let leftTile = level[lY][col];
    let topTile = level[row][tY];
    let bottomTile = level[row][bY];
    
    let tiles = [rightTile, leftTile, topTile, bottomTile];

    tiles.forEach(tile => {
        if (tile.type === "DestructibleWall") {
            destroyWall(tile);
        }
    });  
}

function destroyWall(tile){
    tile.type = "Floor";
    tile.isWalkable = true;
   
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