import { canvas, ctx, level, levelHeight, levelWidth, tileSize, spriteSheet, deltaTime } from "./main.js";
import { PlayAudio } from "./audio.js";
import { Bomb, tilesWithBombs } from "./bomb.js";
import { Powerup, powerups } from "./powerup.js";
import { getTileFromWorldLocation, isDeadly, isWalkable, hasPowerup, getDistanceTo, isOpenExit } from "./utils.js";

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
        const select = index == 1 ? 96 : 64;
        ctx.drawImage(spriteSheet, 0, select, 32, 32, p.x, p.y, p.w, p.h);
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
        this.w = 30;
        this.h = 30;
        this.dx = 0;
        this.dy = 0;

        this.speed = 100.0; // pixels/s
        this.direction = Direction.RIGHT;

        this.collisionOffset = 5;

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
        let collides = false;

        const tile = getTileFromWorldLocation({x: nextX, y: nextY});
        let x = tile.x;
        let y = tile.y;

        if (this.dx < 0) x = tile.x - tileSize;
        if (this.dx > 0) x = tile.x + tileSize;
        if (this.dy < 0) y = tile.y - tileSize;
        if (this.dy > 0) y = tile.y + tileSize;

        const playerTile = getTileFromWorldLocation(this);
        const nextTile = level[x/tileSize][y/tileSize];

        //ctx.fillStyle = "#ff0000";
        //ctx.fillRect(playerTile.x, playerTile.y, 32, 32);

        //ctx.fillStyle = "#00ffff";
        //ctx.fillRect(x, y, 32, 32);

        if (Math.abs(this.dx) > 0 || Math.abs(this.dy) > 0) {

            const distance = Math.hypot(this.x - x, this.y - y);

            // Wall
            if (!nextTile.isWalkable) {
                if (distance <= tileSize) {
                    collides = true;

                    // Corner points of next tile
                    const topLeftCorner     = {x: nextTile.x, y: nextTile.y};
                    const topRightCorner    = {x: nextTile.x + tileSize - 4, y: nextTile.y};
                    const bottomLeftCorner  = {x: nextTile.x, y: nextTile.y + tileSize - 4};
                    const bottomRightCorner = {x: nextTile.x + tileSize - 4, y: nextTile.y + tileSize - 4};

                    const playerCenter      = {x: this.x + (this.w*0.5), y: this.y + (this.h*0.5)};

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
                    //console.log("dist: ", distToClosestCorner);

                    if (distToClosestCorner <= 20) { // TODO: Tweak. n pikseliä kulmasta

                        ctx.fillStyle = "#ff00ff"
                        ctx.fillRect(closestCorner.x, closestCorner.y, 4, 4);

                        // TODO: Tarkistettava, että onko seuraava tile käveltävissä,
                        //       ennen kuin siirtää pelaajan!!

                        const slideSpeed = this.speed * deltaTime;
                        if (this.dx > 0 ) { // Left
                            if (closestCorner == topLeftCorner) {
                                this.y -= slideSpeed;
                            }

                            if (closestCorner == bottomLeftCorner) {
                                this.y += slideSpeed;
                            }


                        } else if (this.dx < 0) { // Right
                            if (closestCorner == topRightCorner) {
                                this.y -= slideSpeed;
                            }

                            if (closestCorner == bottomRightCorner) {
                                this.y += slideSpeed;
                            }
                        }

                        if (this.dy > 0) { // Down
                            if (closestCorner == topLeftCorner) {
                                this.x -= slideSpeed;
                            }

                            if (closestCorner == topRightCorner) {
                                this.y += slideSpeed;
                            }
                        } else if (this.dy < 0) { // Up
                            if (closestCorner == bottomLeftCorner) {
                                this.x -= slideSpeed;
                            }

                            if (closestCorner == bottomRightCorner) {
                                this.x += slideSpeed;
                            }
                        }
                    }
                }
            }

            // Pickup
            if (nextTile.hasPowerup) {
                if (distance <= tileSize - 10) { // 10 pixel threshold
                    this.powerup.pickup(nextTile, this);
                }
            }

            // Exit
            if (nextTile.isExit) {
                if (distance <= tileSize - 10) { // 10 pixel threshold
                    console.log("Exit");
                    if (nextTile.isOpen) {
                        console.info("GG");
                    }
                }
            }
        }

        // Deadly thing
        if (playerTile.isDeadly) {
            this.onDeath();
        }

        if (!collides) {
            this.x += this.dx;
            this.y += this.dy;
        }
    }

    // Bomb
    dropBomb() {
        let bombTile = getTileFromWorldLocation(this);

        if (this.activeBombs < this.powerup.maxBombs) {
            if (!bombTile.bomb || bombTile.bomb.hasExploded) {
                bombTile.bomb = new Bomb(bombTile.x, bombTile.y, this.currentTicks, this.powerup.maxRange, this.id);
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
                }, 20);
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
            PlayAudio("audio/death01.wav");
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

document.addEventListener("DOMContentLoaded", function ()
{
    players.push(new Player(0, 32, 32, keybinds1));
    //players.push(new Player(1, (levelWidth-2)*tileSize, (levelHeight-2)*tileSize, keybinds2));
    for (let i = 0; i < players.length; i++) {
        document.addEventListener("keyup", function(event) {
            players[i].handleKeyUp(event);
        });
        document.addEventListener("keydown", function(event) {
            players[i].handleKeyDown(event);
        });
    }
});

