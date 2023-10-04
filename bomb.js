import { ctx, level, tileSize, spriteSheet, levelWidth, levelHeight, deltaTime, game } from "./main.js";
import { PlayAudio } from "./audio.js";
import { spawnEnemiesAtLocation, findEnemyById, enemies, movementMode } from "./enemy.js";
import { getDistanceTo } from "./utils.js";
import { findPlayerById, players } from "./player.js";

// TODO: jos vihuja kaksi samassa ruudussa, vain toinen kuolee (saattaa olla enemyssä)

// TODO : Näkymättömät pommit
// -> tulee jos seisoo pommin päällä loppuun asti
// EHKÄ : Pakota suunta johon lähetään kävelemään (paitsi että mitä jos painaa sivuttain?)
// Jos ilmenee taas vanha bugi jossa koko peli jäätyy, saattaa johtua renderin splice metodeista.
 
export let tilesWithBombs = [];
let crumblingWalls = [];
let fieryFloors = [];

// Audio
let booms = ["assets/audio/boom01.wav", "assets/audio/boom03.wav", "assets/audio/boom04.wav"];

export class Bomb {
    constructor(x, y, ticks, range, playerId) {
        this.x = x || 0;
        this.y = y || 0,
        this.ticks = ticks || 4;
        this.range = range || 1;
        this.hasExploded = false;
        this.playerId = playerId || 0;

        let ticking = setInterval(() => {
            this.ticks--;
            if (this.hasExploded) {
                clearInterval(ticking);
            }
            else if (this.ticks === 0) {
                const randomBoom = booms[Math.floor(Math.random() * booms.length)];
                PlayAudio(randomBoom, 1);
                explode(this);
                clearInterval(ticking);
            }
        }, 1000);
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
    killEnemies(tiles);
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

    let interval = setInterval(() => {
        tile.animationTimer--;
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
    }, 150);
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
                    break;
                }
                else if (currentTile.type === "Floor") {
                    if (fieryFloors.indexOf(currentTile) === -1) {
                        currentTile.isDeadly = true;
                        fieryFloors.push(currentTile);
                    }

                    if (currentTile.hasPowerup) {
                        currentTile.hasPowerup = false;
                    }
                    else if (currentTile.isExit && !currentTile.isOpen && !currentTile.hasSpawnedEnemies)
                    {
                        currentTile.hasSpawnedEnemies = true;
                        spawnEnemiesAtLocation(currentTile, 8);     // TODO: joku muuttuja vaikeustason mukaan
                    }
                }
        }
    }
}

function killEnemies(tiles) {
    for (let i = 1; i < tiles.length; i++) {
        for (let j = 0; j < tiles[i].length; j++) {
            let currentTile = tiles[i][j];
            if (currentTile.isDeadly) {
                enemies.forEach(enemy => {
                    if (getDistanceTo(currentTile, enemy) < tileSize) {
                        let result = findEnemyById(enemy.id);
                        // console.info("Enemy ID", enemy.id, "died");
                        enemies.splice(result.index, 1);
                        enemy.movementMode = movementMode.IDLE;
                        clearInterval(enemy.timer);
                        enemy = null;               // TODO: Varmistetaan että nämä varmasti poistuu!
                        game.increaseScore(500);    // TODO: Score by enemy type
                        game.decreaseEnemies();
                        // console.log("Enemies left:", game.numOfEnemies);
                        if (game.numOfEnemies === 0) {
                            game.openDoor();
                            PlayAudio("assets/audio/exitopen01.wav");
                        }
                    }
                })    
            }
        }
    }
}

////////////////////
// Render
export function renderBombs() {
    for (let i = 0; i < tilesWithBombs.length; i++) {
        let currentTile = tilesWithBombs[i];

        if (currentTile.bomb.ticks >= 4) {
            ctx.drawImage(spriteSheet, 0, tileSize, tileSize, tileSize, currentTile.bomb.x, currentTile.bomb.y, tileSize, tileSize);
        }
        else if (currentTile.bomb.ticks === 3) {
            ctx.drawImage(spriteSheet, tileSize, tileSize, tileSize, tileSize, currentTile.bomb.x, currentTile.bomb.y, tileSize, tileSize);
        }
        else if (currentTile.bomb.ticks === 2) {
            ctx.drawImage(spriteSheet, tileSize*2, tileSize, tileSize, tileSize, currentTile.bomb.x, currentTile.bomb.y, tileSize, tileSize);
        }
        else if (currentTile.bomb.ticks === 1) {
            ctx.drawImage(spriteSheet, tileSize*3, tileSize, tileSize, tileSize, currentTile.bomb.x, currentTile.bomb.y, tileSize, tileSize);
        }
    }
}

export function renderExplosions() {
    // Walls
    if (crumblingWalls.length > 0) {
        crumblingWalls.forEach(tile => {
            if (tile.animationTimer >= 7) {
                ctx.drawImage(spriteSheet, tileSize*2, 0, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
            }
            else if (tile.animationTimer >= 5) {
                ctx.drawImage(spriteSheet, tileSize*3, 0, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
            }
            else if (tile.animationTimer >= 3) {
                ctx.drawImage(spriteSheet, tileSize*4, 0, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
            }
            else if (tile.animationTimer >= 0) {
                crumblingWalls.splice(0, 1);
            }

        })
    }

    // Floor
    if (fieryFloors.length > 0) {
        fieryFloors.forEach(tile => {
            if (tile.animationTimer === 7) {
                ctx.drawImage(spriteSheet, 0, tileSize*6, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
            }
            else if (tile.animationTimer === 6) {
                ctx.drawImage(spriteSheet, tileSize, tileSize*6, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
            }
            else if (tile.animationTimer === 5) {
                ctx.drawImage(spriteSheet, tileSize*2, tileSize*6, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
            }
            else if (tile.animationTimer === 4) {
                ctx.drawImage(spriteSheet, tileSize*3, tileSize*6, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
            }
            else if (tile.animationTimer === 3) {
                ctx.drawImage(spriteSheet, tileSize*4, tileSize*6, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
                tile.isDeadly = false;
            }
            else if (tile.animationTimer === 2) {
                ctx.drawImage(spriteSheet, tileSize*5, tileSize*6, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
            }
            else if (tile.animationTimer === 1) {
                ctx.drawImage(spriteSheet, tileSize*6, tileSize*6, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
            }
            else if (tile.animationTimer <= 0) {
                fieryFloors.splice(0, 1);
            }
        })
    }
}

export function clearBombArray() {
    tilesWithBombs = [];
}
