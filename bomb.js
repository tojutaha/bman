import { ctx, level, tileSize, spriteSheet } from "./main.js";
import { player } from "./player.js";
import { bombCountPowerUp } from "./powerup.js";
import { getNeigbouringTiles_linear, getTileFromWorldLocation } from "./utils.js";

// TODO: Pommit !walkable
 
let maxBombs = 1;
let maxRange = 1;

let tilesWithBombs = [];
let crumblingWalls = [];
let fieryFloors = [];

function Bomb(y, x, ticks, range) {     // TODO: coord
    this.y = y || 0,
    this.x = x || 0;
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
            currentTile.bomb = new Bomb(currentTile.x, currentTile.y, 4, maxRange);    // TODO: coord
            tilesWithBombs.push(currentTile);
        }
    }
}

// TODO: tän voisi ehkä muokkailla sopivaksi utilsiin
function getBombSurroundings(bomb, range) {     // TODO: coord
    let yIndex = bomb.y / tileSize;
    let xIndex = bomb.x / tileSize;
    let rX = (bomb.x + tileSize) / tileSize;
    let lX = (bomb.x - tileSize) / tileSize;
    let tY = (bomb.y - tileSize) / tileSize;
    let bY = (bomb.y + tileSize) / tileSize;
    
    let centerTile = [level[xIndex][yIndex]],
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
            topTiles.push(level[xIndex][top]);
        }
        if (left > 0) {
            leftTiles.push(level[left][yIndex]);
        }
        if (right < 25) {
            rightTiles.push(level[right][yIndex]);
        }
        if (bottom < 25) {
            bottomTiles.push(level[xIndex][bottom]);
        }
    }
    return [centerTile, topTiles, leftTiles, rightTiles, bottomTiles];
}

function explode(bomb) {
    bomb.hasExploded = true;
    bomb.ticks = 0;
    let tiles = getBombSurroundings(bomb, bomb.range);
    chainExplosions(tiles);
    setTilesOnFire(tiles);
    tilesWithBombs.splice(0, 1);
}

function chainExplosions(tiles) {
    // Tiles[0] is the center, thus i = 1
    for (let i = 1; i < tiles.length; i++) {
        for (let j = 0; j < tiles[i].length; j++) {
                let currentTile = tiles[i][j];
                if ("bomb" in currentTile && currentTile.bomb.hasExploded === false) {
                    console.info(tiles[0][0].x, tiles[0][0].y, "chained",  currentTile.x, currentTile.y);
                    explode(currentTile.bomb);
                };
        }
    }
}

function setTilesOnFire(tiles) {
    for (let i = 0; i < tiles.length; i++) {
        for (let j = 0; j < tiles[i].length; j++) {
                let currentTile = tiles[i][j];
                
                if (currentTile.type === "NonDestructibleWall") {
                    break;
                };
                
                animateExplosion(currentTile);
                if (currentTile.type === "DestructibleWall") {
                    if (crumblingWalls.indexOf(currentTile) === -1) {
                        crumblingWalls.push(currentTile);
                    };
                    currentTile.type = "Floor";
                    break;
                }
                else if (currentTile.type === "Floor") {
                    if (fieryFloors.indexOf(currentTile) === -1) {
                        fieryFloors.push(currentTile);
                    };
                    currentTile.isDeadly = true;
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
        // DEBUG MUSTA PISTE
        else {
            ctx.fillStyle = "#000";
            ctx.fillRect(currentTile.bomb.x + 14, currentTile.bomb.y + 14, 4, 4);
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
