import { ctx, level, tileSize, spriteSheet } from "./main.js";
import { player } from "./player.js";

// TODO: Pommit !walkable
 
let bombs = [];
let crumblingWalls = [];
let fieryFloors = [];

function Bomb(x, y, bombTicks, range) {
    this.x = x || 0;
    this.y = y || 0,
    this.ticks = bombTicks || 4;
    this.range = range || 1;
    this.hasExploded = false;   // Turha?
    
    let ticking = setInterval(() => {
        this.ticks--;
        if (this.ticks === 0) {
            this.hasExploded = true;
            explode(this);
            bombs.splice(0, 1);
            console.log("Bomb exploded in", this.x, this.y);
            clearInterval(ticking);
        }
    }, 1000);
}

export function dropBomb() {
    let bombX = Math.round(player.x / tileSize) * tileSize;
    let bombY = Math.round(player.y / tileSize) * tileSize;
    bombs.push(new Bomb(bombX, bombY, 3, 2));   // TICKS 3, RANGE 2
}

function getBombSurroundings(x, y, range) {
    let row = x / tileSize;
    let col = y / tileSize;
    let rX = (x + tileSize) / tileSize;
    let lX = (x - tileSize) / tileSize;
    let tY = (y - tileSize) / tileSize;
    let bY = (y + tileSize) / tileSize;
    
    let centerTile = [level[row][col]],
        topTiles = [],
        leftTiles = [],
        rightTiles = [],
        bottomTiles = [];

    for (let i = 0; i < range; i++) {
        let right = rX + i;
        let top = tY - i;
        let left = lX - i;
        let bottom = bY + i;

        if (top > 0) {
            topTiles.push(level[row][tY-i]);
        }
        if (left > 0) {
            leftTiles.push(level[lX-i][col]);
        }
        if (right < 25) {
            rightTiles.push(level[right][col]);
        }
        if (bottom < 25) {
            bottomTiles.push(level[row][bY+i]);
        }
    }
    return [centerTile, topTiles, leftTiles, rightTiles, bottomTiles];
}

function explode(bomb) {
    let tiles = getBombSurroundings(bomb.x, bomb.y, bomb.range);
    destroyWalls(tiles);
}

function destroyWalls(tiles) {
    for (let i = 0; i < tiles.length; i++) {
        for (let j = 0; j < tiles[i].length; j++) {
                if (tiles[i][j].type === "NonDestructibleWall") {
                    break;
                };
                
                animateExplosion(tiles[i][j]);
                if (tiles[i][j].type === "DestructibleWall") {
                    crumblingWalls.push(tiles[i][j]);
                    tiles[i][j].type = "Floor";
                    break;
                }
                else if (tiles[i][j].type === "Floor") {
                    tiles[i][j].isDeadly = true;
                    fieryFloors.push(tiles[i][j]);
                };
        }
    }
}

function animateExplosion(tile){
    tile.animationTimer = 3;
    let interval = setInterval(() => {
        tile.animationTimer--;
        if (tile.animationTimer === 0) {
            if (tile.isWalkable) {
                tile.isDeadly = false;
                fieryFloors.splice(0, 1);
            }
            else {
                tile.isWalkable = true;
                crumblingWalls.splice(0, 1);
            }
            clearInterval(interval);
        }
    }, 500);
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
        });
    }
}

export function renderExplosions() {
    if (crumblingWalls.length > 0) {
        crumblingWalls.forEach(wall => {
            if (wall.animationTimer === 3) {
                ctx.drawImage(spriteSheet, 64, 0, 32, 32, wall.y, wall.x, tileSize, tileSize);
            }
            else if (wall.animationTimer === 2) {
                ctx.drawImage(spriteSheet, 96, 0, 32, 32, wall.y, wall.x, tileSize, tileSize);
            }
            else if (wall.animationTimer === 1) {
                ctx.drawImage(spriteSheet, 128, 0, 32, 32, wall.y, wall.x, tileSize, tileSize);
            }
        })
    }

    if (fieryFloors.length > 0) {       // TODO: Animoi lieskat
        fieryFloors.forEach(floor => {
            if (floor.animationTimer > 0) {
                ctx.drawImage(spriteSheet, 128, 32, 32, 32, floor.y, floor.x, tileSize, tileSize);
            }
        })
    }
}