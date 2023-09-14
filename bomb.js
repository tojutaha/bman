import { ctx, level, tileSize, spriteSheet } from "./main.js";
import { player } from "./player.js";

// TODO: Pommit !walkable
 
let tilesWithBombs = [];
let crumblingWalls = [];
let fieryFloors = [];

function Bomb(x, y, ticks, range) {
    this.x = x || 0;
    this.y = y || 0,
    this.ticks = ticks || 4;
    this.range = range || 1;
    
    let ticking = setInterval(() => {
        this.ticks--;
        if (this.ticks === 0) {
            explode(this);
            // tilesWithBombs.splice(0, 1);  // SIIRRETTY EXPLODEEN
            clearInterval(ticking);
        }
    }, 1000);
}

export function dropBomb() {
    let xCoord = Math.round(player.x / tileSize);
    let yCoord = Math.round(player.y / tileSize);

    let xTile = xCoord * tileSize;
    let yTile = yCoord * tileSize;

    level[xCoord][yCoord].bomb = new Bomb(xTile, yTile, 2, 2); // TICKS 2, RANGE 2
    
    tilesWithBombs.push(level[xCoord][yCoord]); 
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
    console.log("left", leftTiles);
    console.log("right", rightTiles);
    console.log("top", topTiles);
    console.log("bot", bottomTiles);
    return [centerTile, topTiles, leftTiles, rightTiles, bottomTiles];
}

function explode(bomb) {
    tilesWithBombs.splice(0, 1);

    let tiles = getBombSurroundings(bomb.x, bomb.y, bomb.range);
    let centerTile = tiles[0][0];     // TODO: vähän hölmö että yhden objektin array

    delete centerTile.bomb;

    destroyWalls(tiles);
}

// TODO: Paljon
function destroyWalls(tiles) {
    for (let i = 0; i < tiles.length; i++) {
        for (let j = 0; j < tiles[i].length; j++) {
                let currentTile = tiles[i][j];
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
                    // TODO: A bomb as a property of tile
                    // if ("bomb" in currentTile && (i > 0 || j > 0)) {
                    //     console.log(currentTile.bomb);
                    //     currentTile.bomb.ticks = 0;
                    //     console.log(currentTile.bomb);
                    //     break;
                    // }
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
            let bomb = tilesWithBombs[i].bomb;

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

        }
    }
}

export function renderExplosions() {
    if (crumblingWalls.length > 0) {
        crumblingWalls.forEach(wall => {
            if (wall.animationTimer === 3) {
                ctx.drawImage(spriteSheet, 64, 0, 32, 32, wall.x, wall.y, tileSize, tileSize);
            }
            else if (wall.animationTimer === 2) {
                ctx.drawImage(spriteSheet, 96, 0, 32, 32, wall.x, wall.y, tileSize, tileSize);
            }
            else if (wall.animationTimer === 1) {
                ctx.drawImage(spriteSheet, 128, 0, 32, 32, wall.x, wall.y, tileSize, tileSize);
            }
        })
    }

    if (fieryFloors.length > 0) {       // TODO: Animoi lieskat
        fieryFloors.forEach(floor => {
            if (floor.animationTimer > 0) {
                ctx.drawImage(spriteSheet, 128, 32, 32, 32, floor.x, floor.y, tileSize, tileSize);
            }
        })
    }
}