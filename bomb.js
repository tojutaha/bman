import { ctx, level, tileSize, spriteSheet } from "./main.js";
import { player } from "./player.js";

// TODO: Pommit !walkable
//     : Suorakulmion nurkassa olevat pommit triggers chains
 
let tilesWithBombs = [];
let crumblingWalls = [];
let fieryFloors = [];

function Bomb(x, y, ticks, range) {
    this.x = x || 0;
    this.y = y || 0,
    this.ticks = ticks || 4;
    this.range = range || 1;
    this.hasExploded = false;
    
    let ticking = setInterval(() => {
        this.ticks--;
        if (this.hasExploded) {
            clearInterval(ticking);
        }
        else if (this.ticks === 0) {
            explode(this);
            clearInterval(ticking);
        }
    }, 1000);
}

export function dropBomb() {
    let yCoord = Math.round(player.y / tileSize);
    let xCoord = Math.round(player.x / tileSize);
    
    let yTile = yCoord * tileSize;
    let xTile = xCoord * tileSize;

    level[yCoord][xCoord].bomb = new Bomb(xTile, yTile, 4, 2); // TICKS 4, RANGE 2
    console.log("Dropped", xCoord*tileSize, yCoord*tileSize);
    
    tilesWithBombs.push(level[yCoord][xCoord]);
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
    bomb.ticks = 0;
    bomb.hasExploded = true;
    // tilesWithBombs.splice(0, 1);
    // console.log("Exploded, tilesWithBombs:", tilesWithBombs);
    // let thisTile = tiles[0][0];
    
    let tiles = getBombSurroundings(bomb.x, bomb.y, bomb.range);
    destroyWalls(tiles);
}

function destroyWalls(tiles) {
    for (let i = 0; i < tiles.length; i++) {
        for (let j = 0; j < tiles[i].length; j++) {
                let currentTile = tiles[i][j];

                if ("bomb" in currentTile && (i > 0 || j > 0) && currentTile.bomb.hasExploded === false) {
                    console.log("Chained", currentTile.x, currentTile.y);
                    explode(currentTile.bomb);
                    break;
                };
                
                if (currentTile.type === "NonDestructibleWall") {
                    break;
                };
                
                animateExplosion(currentTile);
                if (currentTile.type === "DestructibleWall") {
                    crumblingWalls.push(currentTile);
                    currentTile.type = "Floor";
                    break;
                }
                else if (currentTile.type === "Floor") {
                    currentTile.isDeadly = true;
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
    if (tilesWithBombs.length > 0) {
        for (let i = 0; i < tilesWithBombs.length; i++) {
            let currentTile = tilesWithBombs[i];

            if (currentTile.bomb.ticks === 4) {
                ctx.drawImage(spriteSheet, 0, 32, 32, 32, currentTile.bomb.x, currentTile.bomb.y, tileSize, tileSize);
            }
            else if (currentTile.bomb.ticks === 3) {
                ctx.drawImage(spriteSheet, 32, 32, 32, 32, currentTile.bomb.x, currentTile.bomb.y, tileSize, tileSize);
            }
            else if (currentTile.bomb.ticks === 2) {
                ctx.drawImage(spriteSheet, 64, 32, 32, 32, currentTile.bomb.x, currentTile.bomb.y, tileSize, tileSize);
            }
            else if (currentTile.bomb.ticks === 1) {
                ctx.drawImage(spriteSheet, 96, 32, 32, 32, currentTile.bomb.x, currentTile.bomb.y, tileSize, tileSize);
            }
            else if (currentTile.bomb.ticks === 0) {
                tilesWithBombs.splice(i, 1);
                delete currentTile.bomb;
            }
        }
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