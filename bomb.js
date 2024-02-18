import { ctx, tileSize, game, globalPause, bigBomb, isMultiplayer } from "./main.js";
import { getMusicalTimeout, msPerBeat, playAudio, playBirdsong, playRiser, playTrack, randomSfx, sfxs, tracks } from "./audio.js";
import { spawnEnemiesAtLocation, enemies } from "./enemy.js";
import { getDistanceTo, getLinearUntilObstacle } from "./utils.js";
import { findPlayerById, players } from "./player.js";
import { exitLocation } from "./tile.js";
import { spriteSheets } from "./spritesheets.js";
import { lastLevel, levelType } from "./gamestate.js";
import { initPickups } from "./pickups.js";
import { createFloatingText } from "./particles.js";

export let tilesWithBombs = [];
let crumblingWalls = [];
let fieryFloors = [];

export class Bomb {
    constructor(x, y, range, playerId) {
        this.x = x || 0;
        this.y = y || 0,
        this.range = range || 1;
        this.hasExploded = false;
        this.playerId = playerId || 0;
        this.checkFirstBomb();

        // Collision
        this.w = tileSize;
        this.h = tileSize;
        this.collisionW = this.w;
        this.collisionH = this.h;
        this.collisionBox = {x: this.x, y: this.y, w: this.collisionW, h: this.collisionH};
        
        // Animation
        this.currentFrame = 0;
        this.frames = 15;
        
        this.ticking = setInterval(() => {
            if (globalPause) return;

            this.currentFrame++;
            if (this.hasExploded) {
                clearInterval(this.ticking);
            }
            else if (this.currentFrame >= this.frames) {
                // Bombs explode in time with the music
                let delay;
                if (!game.firstBombExploded) {
                    // First bomb explodes onbeat
                    delay = getMusicalTimeout();
                    // Extra delay for drama.
                    delay += msPerBeat * 2;
                } else {
                    // Rest of the bombs explode offbeat
                    delay = getMusicalTimeout(true);
                }
                
                setTimeout(() => {
                    explode(this);

                    if (!game.beatDropped) {
                        setTimeout(() => {
                            if (game.level === 1 && !isMultiplayer) {
                                playBirdsong();
                                playTrack(tracks['SLOWHEART']);
                            }
                            else if (isMultiplayer) {
                                // Don't change the music if player dies on spawn
                                let spawnDeath = false;
                                players.forEach(player => {
                                    if (player.isDead) {
                                        spawnDeath = true;
                                    }
                                });
                                if (spawnDeath) return;

                                if (levelType === 'forest_day') {
                                    playBirdsong();
                                    playTrack(tracks['MP_DAY']);
                                }
                                else if (levelType === 'forest_night') {
                                    playTrack(tracks['MP_NIGHT']);
                                }
                                else if (levelType === 'hell') {
                                    playTrack(tracks['MP_HELL']);
                                } else {
                                    playTrack(tracks['MP_WAIT']);
                                }
                            }
                            else if (lastLevel) {
                                playTrack(tracks['HEART_DRONES']);
                            } else {
                                playTrack(tracks['INT2']);

                            }
                        }, msPerBeat);
                        game.beatDropped = true;
                    }
                }, delay);

                clearInterval(this.ticking);
            }
        }, 150);
    }

    checkFirstBomb() {
        if (game.firstBombDropped) return;

        game.firstBombDropped = true;
        if (game.level === 1) {
            bigBomb.playLightUp();
            playRiser();
        }
    }
}


function explode(bomb) {
    if (!game.firstBombExploded) {
        game.firstBombExploded = true;
        if (game.level === 1) {
            bigBomb.playShatter();
        }
    }

    const randomBomb = randomSfx(sfxs['BOMBS']);
    playAudio(randomBomb);

    let tiles = getLinearUntilObstacle(bomb, bomb.range, true, true);
    let centerTile = tiles[0][0];
    
    if (!centerTile.isWalkable) {
        centerTile.isWalkable = true;
    }

    bomb.hasExploded = true;
    tilesWithBombs.splice(0, 1);

    let player = findPlayerById(bomb.playerId);
    if (player.activeBombs > 0) {
        player.activeBombs--;
    }

    chainExplosions(tiles, bomb.playerId);
    setTilesOnFire(tiles, bomb.playerId);
}

function chainExplosions(tiles, playerId) {
    // Tiles[0] is the center, not necessary to iterate over it
    for (let i = 1; i < tiles.length; i++) {
        for (let j = 0; j < tiles[i].length; j++) {
                let currentTile = tiles[i][j];
                if ("bomb" in currentTile && currentTile.bomb.hasExploded === false) {
                    currentTile.bomb.playerId = playerId;
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

function setTilesOnFire(tiles, playerID) {
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
                        currentTile.instigatedBy = playerID;
                        fieryFloors.push(currentTile);
                    }

                    if (currentTile.hasPowerup) {
                        currentTile.hasPowerup = false;
                        initPickups();
                    }

                    if (currentTile.hasMushroom) {
                        const mushroomScore = 10;

                        currentTile.hasMushroom = false;
                        game.increaseScore(mushroomScore);
                        createFloatingText({x: currentTile.x, y: currentTile.y}, `+${mushroomScore}`);
                        initPickups();
                    }

                    if (currentTile.isExit && !currentTile.hasSpawnedEnemies)
                    {
                        if (exitLocation.isOpen) {
                            game.toggleDoor();
                        }
                        playAudio(sfxs['BLASTED_DOOR']);
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
                enemy.die(tile.instigatedBy);
            }
        })
    }
}

////////////////////
// Render
const bombImage = new Image();
export function renderBombs() {
    if (!bombImage.src) {
        bombImage.src = spriteSheets.bomb;
    }
    for (let i = 0; i < tilesWithBombs.length; i++) {
        let currentTile = tilesWithBombs[i];
        ctx.drawImage(bombImage, 
            tileSize*currentTile.bomb.currentFrame, 0, 
            tileSize, tileSize,  currentTile.bomb.x, currentTile.bomb.y, tileSize, tileSize);
    }
}

const softWallTexture = new Image();
const explosionImage = new Image();
export function renderExplosions() {
    if (!softWallTexture.src) {
        softWallTexture.src = spriteSheets.wall_animation;
    }
    if (!explosionImage.src) {
        explosionImage.src = spriteSheets.explosion;
    }
    
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
        ctx.drawImage(explosionImage, 
            tileSize*tile.currentFrame, 0, 
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

// Clears all bombs and fire from the level
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
