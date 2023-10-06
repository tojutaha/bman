import { canvas, ctx, level, levelHeight, levelWidth, tileSize, spriteSheet, deltaTime, game } from "./main.js";
import { PlayAudio } from "./audio.js";
import { Bomb, tilesWithBombs } from "./bomb.js";
import { Powerup, powerups } from "./powerup.js";
import { aabbCollision, getTileFromWorldLocation, isDeadly, isWalkable, hasPowerup, getDistanceTo, isOpenExit, getNeigbouringTiles_diagonal, getNeigbouringTiles_linear, getRandomColor, getTileFromWorldLocationF, getSurroundingTiles } from "./utils.js";

export const Direction = {
    UP: "Up",
    DOWN: "Down",
    LEFT: "Left",
    RIGHT: "Right",
}

export function renderPlayer()
{
    players.forEach((p, index) => {
        p.update();
        // TODO: Hack..
        const select = index == 1 ? tileSize*3 : tileSize*2;
        // TODO: lopuksi sprite piirtymään tileSizen kokoiseksi, muuten sumea
        ctx.drawImage(spriteSheet, 0, select, tileSize, tileSize, p.x, p.y, p.w, p.h);
    });
}

////////////////////////////////////////////////////////////////////////////////
// Players
export const players = [];

class Player
{
    constructor(id, x, y, keybinds, sprite) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.w = tileSize-2;
        this.h = tileSize-2;
        this.dx = 0;
        this.dy = 0;

        this.speed = 150.0; // pixels/s
        this.direction = Direction.RIGHT;

        //this.collisionOffset = 5;
        this.collisionW = this.w - 10;
        this.collisionH = this.h - 10;

        // Key binds
        this.keybinds = keybinds;

        // Powerups
        this.activeBombs = 0;
        this.powerup = new Powerup();
    }

    // Handles movement and collision
    update() {
        const nextX = this.x + this.dx;
        const nextY = this.y + this.dy;

        const playerTile = getTileFromWorldLocation(this);
        const playerBox = {x: nextX + 5, y: nextY + 5, w: this.collisionW, h: this.collisionH};
        ctx.fillRect(playerBox.x, playerBox. y, this.collisionW, this.collisionH);

        const tilesToCheck = getSurroundingTiles(playerBox);

        let collides = false;
        for (let i = 0; i < tilesToCheck.length; i++) {
            const tileBox = {x: tilesToCheck[i].x , y: tilesToCheck[i].y , w: tileSize, h: tileSize};

            if (!tilesToCheck[i].isWalkable && aabbCollision(playerBox, tileBox)) {

                const tile = tilesToCheck[i];
                collides = true;

                // Corner points of tile
                const playerCenter      = {x: this.x + (this.collisionW*0.5), y: this.y + (this.collisionH*0.5)};
                const topLeftCorner     = {x: tile.x, y: tile.y};
                const topRightCorner    = {x: tile.x + tileSize - 4, y: tile.y};
                const bottomLeftCorner  = {x: tile.x, y: tile.y + tileSize - 4};
                const bottomRightCorner = {x: tile.x + tileSize - 4, y: tile.y + tileSize - 4};

                // Calculate distances to each corner
                const distTopLeft     = Math.hypot(topLeftCorner.x - playerCenter.x, topLeftCorner.y - playerCenter.y);
                const distTopRight    = Math.hypot(topRightCorner.x - playerCenter.x, topRightCorner.y - playerCenter.y);
                const distBottomLeft  = Math.hypot(bottomLeftCorner.x - playerCenter.x, bottomLeftCorner.y - playerCenter.y);
                const distBottomRight = Math.hypot(bottomRightCorner.x - playerCenter.x, bottomRightCorner.y - playerCenter.y);

                // Find the minimum distance and corresponding corner
                let minDist = distTopLeft;
                let closestCorner = topLeftCorner;

                if (distTopRight < minDist) {
                    minDist = distTopRight;
                    closestCorner = topRightCorner;
                }
                if (distBottomLeft < minDist) {
                    minDist = distBottomLeft;
                    closestCorner = bottomLeftCorner;
                }
                if (distBottomRight < minDist) {
                    minDist = distBottomRight;
                    closestCorner = bottomRightCorner;
                }

                const distToClosestCorner = Math.hypot(playerCenter.x - closestCorner.x, playerCenter.y - closestCorner.y);
                if (distToClosestCorner <= 46) { // TODO: Tweak. n pikseliä kulmasta

                    // Left
                    const lx = (tile.x - tileSize) / tileSize;
                    const ly = tile.y / tileSize;
                    // Right
                    const rx = (tile.x + tileSize) / tileSize;
                    const ry = tile.y / tileSize;
                    // Up
                    const ux = tile.x / tileSize;
                    const uy = (tile.y - tileSize) / tileSize;
                    // Down
                    const dx = tile.x / tileSize;
                    const dy = (tile.y + tileSize) / tileSize;

                    // Bounds check
                    if (lx < 0 || rx < 0 || ux < 0 || dx < 0 ||
                        lx >= levelWidth || rx >= levelWidth || 
                        ux >= levelWidth || dx >= levelWidth) {
                        return;
                    }

                    if (ly < 0 || ry < 0 || uy < 0 || dy < 0 ||
                        ly >= levelHeight || ry >= levelHeight ||
                        uy >= levelHeight || dy >= levelHeight) {
                        return;
                    }

                    const leftTile = level[lx][ly];
                    const rightTile = level[rx][ry];
                    const upTile = level[ux][uy];
                    const downTile = level[dx][dy];

                    // TODO: pelaajasta seuraavien laattojen tarkistus...

                    const slideSpeed = this.speed * deltaTime;
                    if (this.dx > 0 ) { // Left
                        if (closestCorner == topLeftCorner) {
                            // Top of player
                            //ctx.fillStyle = "#00ff00";
                            //ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
                            //ctx.fillStyle = "#ff0000";
                            //ctx.fillRect(upTile.x, upTile.y, tileSize, tileSize);

                            if (upTile.isWalkable) {
                                //this.y -= slideSpeed;
                            }
                        }

                        if (closestCorner == bottomLeftCorner) {
                            // Bottom of player
                            //ctx.fillStyle = "#00ff00";
                            //ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
                            //ctx.fillStyle = "#ff0000";
                            //ctx.fillRect(downTile.x, downTile.y, tileSize, tileSize);

                            if (downTile.isWalkable) {
                                //this.y += slideSpeed;
                            }
                        }


                    } else if (this.dx < 0) { // Right
                        if (closestCorner == topRightCorner) {
                            //ctx.fillStyle = "#00ff00";
                            //ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
                            //ctx.fillStyle = "#ff0000";
                            //ctx.fillRect(upTile.x, upTile.y, tileSize, tileSize);

                            if (upTile.isWalkable) {
                                //this.y -= slideSpeed;
                            }
                        }

                        if (closestCorner == bottomRightCorner) {
                            // Bottom of player
                            //ctx.fillStyle = "#00ff00";
                            //ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
                            //ctx.fillStyle = "#ff0000";
                            //ctx.fillRect(downTile.x, downTile.y, tileSize, tileSize);

                            if (downTile.isWalkable) {
                                //this.y += slideSpeed;
                            }
                        }
                    }

                    if (this.dy > 0) { // Down
                        if (closestCorner == topLeftCorner) {
                            // Left of player
                            //ctx.fillStyle = "#00ff00";
                            //ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
                            //ctx.fillStyle = "#ff0000";
                            //ctx.fillRect(leftTile.x, leftTile.y, tileSize, tileSize);

                            if (leftTile.isWalkable) {
                                //this.x -= slideSpeed;
                            }
                        }

                        if (closestCorner == topRightCorner) {
                            // Right of player
                            //ctx.fillStyle = "#00ff00";
                            //ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
                            //ctx.fillStyle = "#ff0000";
                            //ctx.fillRect(rightTile.x, rightTile.y, tileSize, tileSize);

                            if (rightTile.isWalkable) {
                                //this.x += slideSpeed;
                            }
                        }
                    } else if (this.dy < 0) { // Up
                        if (closestCorner == bottomLeftCorner) {
                            // Left of player
                            //ctx.fillStyle = "#00ff00";
                            //ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
                            //ctx.fillStyle = "#ff0000";
                            //ctx.fillRect(leftTile.x, leftTile.y, tileSize, tileSize);

                            if (leftTile.isWalkable) {
                                //this.x -= slideSpeed;
                            }
                        }

                        if (closestCorner == bottomRightCorner) {
                            // Right of player
                            //ctx.fillStyle = "#00ff00";
                            //ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
                            //ctx.fillStyle = "#ff0000";
                            //ctx.fillRect(rightTile.x, rightTile.y, tileSize, tileSize);

                            if (rightTile.isWalkable) {
                                //this.x += slideSpeed;
                            }
                        }
                    }
                }
            }
        }

        if (playerTile.hasPowerup) {
            this.powerup.pickup(playerTile, this);
        }

        if (playerTile.isExit) {
            console.log("Exit");
            if (playerTile.isOpen) {
                console.log("GG");
                game.nextLevel();
                collides = true;
            }
        }

        if (playerTile.isDeadly) {
            this.onDeath();
        }

        if (!collides) {
            this.x = nextX;
            this.y = nextY;
        }
    }

    // Bomb
    dropBomb() {
        let bombTile = getTileFromWorldLocation(this);

        if (this.activeBombs < this.powerup.maxBombs) {
            if (!bombTile.bomb || bombTile.bomb.hasExploded) {
                bombTile.bomb = new Bomb(bombTile.x, bombTile.y, this.powerup.currentTicks, this.powerup.maxRange, this.id);
                this.activeBombs++;
                tilesWithBombs.push(bombTile);
                
                // Checks whether any player is still standing on the bomb after it was dropped.
                let posCheck = setInterval(() => {
                    let isPlayerOnBomb = false;
                    for (let i = 0; i < players.length; i++) {
                        if (getDistanceTo(bombTile, players[i]) <= tileSize) {
                            isPlayerOnBomb = true;
                            break;
                        }
                    }
                    if (!isPlayerOnBomb) {
                        bombTile.isWalkable = false;
                        clearInterval(posCheck);
                    }
                }, 10);
            }
        }
    }

    // Inputs
    handleKeyDown(event) {
        event.preventDefault();

        switch(event.key) {
            case this.keybinds.move_up:
                this.dy = -this.speed * deltaTime;
                this.dx = 0;
                this.direction = Direction.UP;
                break;

            case this.keybinds.move_left:
                this.dx = -this.speed * deltaTime;
                this.dy = 0;
                this.direction = Direction.LEFT;
                break;

            case this.keybinds.move_down:
                this.dy = this.speed * deltaTime;
                this.dx = 0;
                this.direction = Direction.DOWN;
                break;

            case this.keybinds.move_right:
                this.dx = this.speed * deltaTime;
                this.dy = 0;
                this.direction = Direction.RIGHT;
                break;

            case this.keybinds.drop_bomb:
                this.dropBomb();
                break;
        }
    }

    handleKeyUp(event) {
        event.preventDefault();

        switch(event.key) {
            case this.keybinds.move_up:
            case this.keybinds.move_down:
                this.dy = 0;
                break;

            case this.keybinds.move_left:
            case this.keybinds.move_right:
                this.dx = 0;
                break;
        }
    }

    onDeath() {
        console.log("onDeath");
        if (!this.isDead) {
            // PlayAudio("assets/audio/death01.wav");
            this.isDead = true;
        }
    }
};

export const keybinds1 = {
    move_up: "w",
    move_down: "s",
    move_left: "a",
    move_right: "d",
    drop_bomb: " ",
};

export const keybinds2 = {
    move_up: "ArrowUp",
    move_down: "ArrowDown",
    move_left: "ArrowLeft",
    move_right: "ArrowRight",
    drop_bomb: "Enter",
};

// Finds a player with given id and returns it
export function findPlayerById(id) {
    let index = players.findIndex(player => player.id === id);
    return players[index];
}

const StartPos = {
    // TODO: taikanumerot pois, mainin settingejä ei deklaroitu vielä tässä vaiheessa?
    // Top left
    P0X: 64,
    P0Y: 64,

    // Bottom right
    // P1X: (levelWidth-2)*tileSize,
    // P1Y: (levelHeight-2)*tileSize,
}

export function resetPlayerPositions() {    // TODO: muut pelaajat

    players.forEach((p) => {
        if (p.id === 0) {
            p.x = StartPos.P0X;
            p.y = StartPos.P0Y;
        }
    });
}

export function spawnPlayers()
{
    players.push(new Player(0, StartPos.P0X, StartPos.P0Y, keybinds1));
    // players.push(new Player(1, (levelWidth-2)*tileSize, (levelHeight-2)*tileSize, keybinds2));
    for (let i = 0; i < players.length; i++) {
        document.addEventListener("keyup", function(event) {
            players[i].handleKeyUp(event);
        });
        document.addEventListener("keydown", function(event) {
            players[i].handleKeyDown(event);
        });
    }
};
