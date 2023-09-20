import { ctx, level, tileSize, spriteSheet, levelWidth, levelHeight } from "./main.js";
import { player } from "./player.js";
import { getTileFromWorldLocation } from "./utils.js";

// TODO : Pommit !walkable
//      : Lieskojen animointi
 
// Powerup variables
export let maxBombs = 1;
export let maxRange = 1;
let currentTicks = 4;

export function setMaxBombs(value) {
    maxBombs = value;
}

export function setMaxRange(value) {
    maxRange = value;
}


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
    let currentTile = getTileFromWorldLocation(player);

    if (tilesWithBombs.indexOf(currentTile) === -1 && tilesWithBombs.length < maxBombs) {
        if (!currentTile.bomb || currentTile.bomb.hasExploded === true) {
            currentTile.bomb = new Bomb(currentTile.x, currentTile.y, currentTicks, maxRange);
            // currentTile.isWalkable = false;         // TODO: walkable
            tilesWithBombs.push(currentTile);
        }
    }
}

// Returns a 2D array of all the surrounding tiles within the bomb's range.
// All directions are in their own arrays for further processing.
function getBombSurroundings(bomb) {
    let xIndex = bomb.x / tileSize;
    let yIndex = bomb.y / tileSize;

    let centerTile = [level[xIndex][yIndex]],
        topTiles = [],
        leftTiles = [],
        rightTiles = [],
        bottomTiles = [];
    
    for (let i = 0; i < bomb.range; i++) {
        let onLeft = xIndex - i - 1;
        if (onLeft >= 0) {
            leftTiles.push(level[onLeft][yIndex]);
        }

        let onTop = yIndex - i - 1;
        if (onTop >= 0) {
            topTiles.push(level[xIndex][onTop]);
        }

        let onRight = xIndex + i + 1;
        if (onRight < levelWidth) {
            rightTiles.push(level[onRight][yIndex]);
        }

        let onBottom = yIndex + i + 1;
        if (onBottom < levelHeight) {
            bottomTiles.push(level[xIndex][onBottom]);
        }
    }

    return [centerTile, leftTiles, topTiles, rightTiles, bottomTiles];
}

function explode(bomb) {
    bomb.hasExploded = true;
    bomb.ticks = 0;
    tilesWithBombs.splice(0, 1);

    let tiles = getBombSurroundings(bomb);
    chainExplosions(tiles);
    setTilesOnFire(tiles);
}

function chainExplosions(tiles) {
    // Tiles[0] is the center, not necessary to iterate over it
    for (let i = 1; i < tiles.length; i++) {
        for (let j = 0; j < tiles[i].length; j++) {
                let currentTile = tiles[i][j];
                if ("bomb" in currentTile && currentTile.bomb.hasExploded === false) {
                    console.info(tiles[0][0].x, tiles[0][0].y, "chained",  currentTile.x, currentTile.y);
                    explode(currentTile.bomb);
                }
        }
    }
}

function setTilesOnFire(tiles) {
    for (let i = 0; i < tiles.length; i++) {
        for (let j = 0; j < tiles[i].length; j++) {
                let currentTile = tiles[i][j];
                
                if (currentTile.type === "HardWall") {
                    break;
                }
                
                animateExplosion(currentTile);
                if (currentTile.type === "SoftWall") {
                    if (crumblingWalls.indexOf(currentTile) === -1) {
                        crumblingWalls.push(currentTile);
                    }
                    currentTile.type = "Floor";
                    break;
                }
                else if (currentTile.type === "Floor") {
                    if (fieryFloors.indexOf(currentTile) === -1) {
                        fieryFloors.push(currentTile);
                    }
                    currentTile.isDeadly = true;
                    if (currentTile.hasPowerup) {
                        currentTile.hasPowerup = false;
                    }
                }
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
            }
            else {
                tile.isWalkable = true;
            }
            clearInterval(interval);
        }
    }, 500);
}

////////////////////
// Render
export function renderBombs() {
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
