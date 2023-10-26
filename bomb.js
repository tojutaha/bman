import { ctx, level, tileSize, spriteSheet, game, globalPause } from "./main.js";
import { levelHeight, levelWidth } from "./gamestate.js";
import { PlayAudio } from "./audio.js";
import { spawnEnemiesAtLocation, enemies } from "./enemy.js";
import { getDistanceTo } from "./utils.js";
import { findPlayerById, players } from "./player.js";
import { exitLocation } from "./tile.js";

export let tilesWithBombs = [];
let crumblingWalls = [];
let fieryFloors = [];

// Audio
const booms = ["assets/sfx/bomb01.mp3", "assets/sfx/bomb02.mp3", "assets/sfx/bomb03.mp3"];

export class Bomb {
    constructor(x, y, ticks, range, playerId) {
        this.x = x || 0;
        this.y = y || 0,
        this.ticks = ticks || 4;
        this.range = range || 1;
        this.hasExploded = false;
        this.playerId = playerId || 0;
        this.currentFrame = 0;

        // Collision
        this.w = tileSize;
        this.h = tileSize;
        this.collisionW = this.w;
        this.collisionH = this.h;
        this.collisionBox = {x: this.x, y: this.y, w: this.collisionW, h: this.collisionH};
    
        this.ticking = setInterval(() => {
            if(globalPause) return;
            this.ticks--;
            this.currentFrame++;
            if (this.hasExploded) {
                clearInterval(this.ticking);
            }
            else if (this.ticks === 0) {
                const randomBoom = booms[Math.floor(Math.random() * booms.length)];
                PlayAudio(randomBoom, 1);
                explode(this);
                clearInterval(this.ticking);
            }
        }, 1000);
    }
}

// Returns a 2D array of the surrounding tiles within the bomb's range.
// All directions are in their own arrays for further processing.
function getBombSurroundings(bomb) {
    let xIndex = bomb.x / tileSize;
    let yIndex = bomb.y / tileSize;

    let centerTile = [level[xIndex][yIndex]],
        topTiles = [],
        leftTiles = [],
        rightTiles = [],
        bottomTiles = [];
    
    let leftWallReached = false,
        topWallReached = false,
        rightWallReached = false,
        bottomWallReached = false;
    
    for (let i = 0; i < bomb.range; i++) {
        if (!leftWallReached) {
            let onLeft = xIndex - i - 1;
            if (onLeft >= 0) {
                let currentTile = level[onLeft][yIndex];
                leftTiles.push(currentTile);
                if (currentTile.type === "SoftWall" || (currentTile.bomb && !currentTile.bomb.hasExploded)) {
                    leftWallReached = true;
                }
            }
        }

        if (!topWallReached) {
            let onTop = yIndex - i - 1;
            if (onTop >= 0) {
                let currentTile = level[xIndex][onTop];
                topTiles.push(currentTile);
                if (currentTile.type === "SoftWall" || (currentTile.bomb && !currentTile.bomb.hasExploded)) {
                    topWallReached = true;
                }
            }            
        }

        if (!rightWallReached) {
            let onRight = xIndex + i + 1;
            if (onRight < levelWidth) {
                let currentTile = level[onRight][yIndex];
                rightTiles.push(currentTile);
                if (currentTile.type === "SoftWall" || (currentTile.bomb && !currentTile.bomb.hasExploded)) {
                    rightWallReached = true;
                }
            }
        }

        if (!bottomWallReached) {
            let onBottom = yIndex + i + 1;
            if (onBottom < levelHeight) {
                let currentTile = level[xIndex][onBottom];
                bottomTiles.push(currentTile);
                if (currentTile.type === "SoftWall" || (currentTile.bomb && !currentTile.bomb.hasExploded)) {
                    bottomWallReached = true;
                }
            }
        }
    }

    return [centerTile, leftTiles, topTiles, rightTiles, bottomTiles];
}

function explode(bomb) {
    if (!game.firstBombExploded) {
        game.firstBombExploded = true;
        game.checkGameState();
    }

    let tiles = getBombSurroundings(bomb);
    let centerTile = tiles[0][0];
    
    if (!centerTile.isWalkable) {
        centerTile.isWalkable = true;
    }

    bomb.hasExploded = true;
    bomb.ticks = 0;
    tilesWithBombs.splice(0, 1);

    let player = findPlayerById(bomb.playerId);
    player.activeBombs--;

    chainExplosions(tiles);
    setTilesOnFire(tiles);
}

function chainExplosions(tiles) {
    // Tiles[0] is the center, not necessary to iterate over it
    for (let i = 1; i < tiles.length; i++) {
        for (let j = 0; j < tiles[i].length; j++) {
                let currentTile = tiles[i][j];
                if ("bomb" in currentTile && currentTile.bomb.hasExploded === false) {
                    // console.info(tiles[0][0].x, tiles[0][0].y, "chained",  currentTile.x, currentTile.y);
                    explode(currentTile.bomb);
                }
        }
    }
}

function animateExplosion(tile) {
    tile.isBeingAnimated = true;
    tile.animationTimer = 7;
    tile.currentFrame = 0;

    let interval = setInterval(() => {
        tile.animationTimer--;
        tile.currentFrame++;
        if (tile.animationTimer <= 0) {
            if (tile.isWalkable) {
                tile.isDeadly = false;
            }
            else {
                tile.isWalkable = true;
            }
            tile.isBeingAnimated = false;
            clearInterval(interval);
        }
    }, 130);
}

function setTilesOnFire(tiles) {
    for (let i = 0; i < tiles.length; i++) {
        for (let j = 0; j < tiles[i].length; j++) {
                let currentTile = tiles[i][j];
                
                // Hardwall stops the explosion and there's no need to animate it
                if (currentTile.type === "HardWall") {
                    break;
                }
                
                if (!currentTile.isBeingAnimated) {
                    animateExplosion(currentTile);
                }

                if (currentTile.type === "SoftWall") {
                    if (crumblingWalls.indexOf(currentTile) === -1) {
                        crumblingWalls.push(currentTile);
                    }
                    // The tile turns already into a floor at this point so that it will render under the crumbling wall
                    currentTile.type = "Floor";
                }
                else if (currentTile.type === "Floor") {
                    if (fieryFloors.indexOf(currentTile) === -1) {
                        currentTile.isDeadly = true;
                        fieryFloors.push(currentTile);
                    }

                    if (currentTile.hasPowerup) {
                        currentTile.hasPowerup = false;
                    }
                    else if (currentTile.isExit && !currentTile.hasSpawnedEnemies)
                    {
                        if (exitLocation.isOpen) {
                            game.toggleDoor();
                        }
                        spawnEnemiesAtLocation(currentTile, game.level + 3);
                        currentTile.hasSpawnedEnemies = true;
                    }
                }
        }
    }
}

function killEnemies(tile) {
    if (tile.isDeadly) {
        enemies.forEach(enemy => {
            if (enemy.justSpawned) return;

            if (getDistanceTo(tile, enemy) < tileSize) {
                enemy.die();
            }
        })
    }
}

////////////////////
// Render
export function renderBombs() {
    for (let i = 0; i < tilesWithBombs.length; i++) {
        let currentTile = tilesWithBombs[i];
        ctx.drawImage(spriteSheet, 
            tileSize*currentTile.bomb.currentFrame, tileSize, 
            tileSize, tileSize,  currentTile.bomb.x, currentTile.bomb.y, tileSize, tileSize);
    }
}

const softWallTexture = new Image();
softWallTexture.src = "./assets/stone_brick_03_alt.png"
export function renderExplosions() {
    // Walls
    crumblingWalls.forEach(tile => {
        ctx.drawImage(softWallTexture, 
            tileSize*tile.currentFrame, 0, 
            tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);

        if (tile.animationTimer === 3) {
            crumblingWalls.splice(0, 1);
        }
    });

    // Floor
    fieryFloors.forEach(tile => {
        ctx.drawImage(spriteSheet, 
            tileSize*tile.currentFrame, tileSize*6, 
            tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);

        if (tile.animationTimer <= 2) {
            tile.isDeadly = false;
        }

        if (tile.animationTimer <= 0) {
            fieryFloors.splice(0, 1);
        }

        killEnemies(tile);
    });
}

// This is called only when changing level and does only what's necessary for that
// - it doesn't do the whole exploding process and make the tiles walkable for example.
export function clearBombs() {
    tilesWithBombs.forEach(tile => {
        tile.isWalkable = true;
        clearInterval(tile.bomb.ticking);
        for (let prop in tile) {
            tile.bomb[prop] = null;
        }
    });
    tilesWithBombs = [];
    crumblingWalls = [];
    fieryFloors = [];

    players.forEach(p => {
        p.activeBombs = 0;
    });
}
