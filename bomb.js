import { ctx, level, tileSize, spriteSheet, levelWidth, levelHeight } from "./main.js";

// Jos ilmenee taas vanha bugi jossa koko peli jäätyy, saattaa johtua renderin splice metodeista.


// TODO : Näkymättömät pommit
// -> tulee jos seisoo pommin päällä loppuun asti
// TODO : Jos toinen pelaaja jättää pommin, toinen jumahtaa siihen kiinni
// TODO : Lieskojen animointi
// EHKÄ : Pakota suunta johon lähetään kävelemään (paitsi että mitä jos painaa sivuttain?)
 
export let tilesWithBombs = [];
let crumblingWalls = [];
let fieryFloors = [];

export function Bomb(x, y, ticks, range) {
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
    tile.animationTimer = 7;
    let interval = setInterval(() => {
        tile.animationTimer--;
        if (tile.animationTimer === 0) {
            if (tile.isWalkable) {
                tile.isDeadly = false; // This happens now in render when there's just smoke left
            }
            else {
                tile.isWalkable = true;
            }
            clearInterval(interval);
        }
    }, 150);
}

////////////////////
// Render
export function renderBombs() {
    for (let i = 0; i < tilesWithBombs.length; i++) {
        let currentTile = tilesWithBombs[i];

        if (currentTile.bomb.ticks >= 4) {
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
        else if (currentTile.bomb.ticks <= 0) {
            if (currentTile.isWalkable === false)
            {
                currentTile.isWalkable = true;
                tilesWithBombs.splice(0, 1);
            }
        }
    }
}

export function renderExplosions() {
    if (crumblingWalls.length > 0) {
        crumblingWalls.forEach(wall => {
            if (wall.animationTimer >= 7) {
                ctx.drawImage(spriteSheet, 64, 0, 32, 32, wall.x, wall.y, tileSize, tileSize);
            }
            else if (wall.animationTimer >= 5) {
                ctx.drawImage(spriteSheet, 96, 0, 32, 32, wall.x, wall.y, tileSize, tileSize);
            }
            else if (wall.animationTimer >= 3) {
                ctx.drawImage(spriteSheet, 128, 0, 32, 32, wall.x, wall.y, tileSize, tileSize);
            }
            else if (wall.animationTimer >= 0) {
                crumblingWalls.splice(0, 1);
            }

        })
    }

    if (fieryFloors.length > 0) {
        fieryFloors.forEach(floor => {
            if (floor.animationTimer === 7) {
                ctx.drawImage(spriteSheet, 0, 192 , 32, 32, floor.x, floor.y, tileSize, tileSize);
            }
            else if (floor.animationTimer === 6) {
                ctx.drawImage(spriteSheet, 32, 192 , 32, 32, floor.x, floor.y, tileSize, tileSize);
            }
            else if (floor.animationTimer === 5) {
                ctx.drawImage(spriteSheet, 64, 192 , 32, 32, floor.x, floor.y, tileSize, tileSize);
            }
            else if (floor.animationTimer === 4) {
                ctx.drawImage(spriteSheet, 96, 192 , 32, 32, floor.x, floor.y, tileSize, tileSize);
            }
            else if (floor.animationTimer === 3) {
                ctx.drawImage(spriteSheet, 128, 192 , 32, 32, floor.x, floor.y, tileSize, tileSize);
                floor.isDeadly = false;
            }
            else if (floor.animationTimer === 2) {
                ctx.drawImage(spriteSheet, 160, 192 , 32, 32, floor.x, floor.y, tileSize, tileSize);
            }
            else if (floor.animationTimer === 1) {
                ctx.drawImage(spriteSheet, 192, 192 , 32, 32, floor.x, floor.y, tileSize, tileSize);
            }
            else if (floor.animationTimer <= 0) {
                fieryFloors.splice(0, 1);
            }
        })
    }
}