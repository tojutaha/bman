import { canvas, ctx, level, levelHeight, levelWidth, tileSize, spriteSheet, deltaTime, game } from "./main.js";
import { PlayAudio } from "./audio.js";
import { Bomb, tilesWithBombs } from "./bomb.js";
import { Powerup, powerups } from "./powerup.js";
import { getTileFromWorldLocation, isDeadly, isWalkable, hasPowerup, getDistanceTo, isOpenExit, getNeigbouringTiles_diagonal, getNeigbouringTiles_linear, getRandomColor } from "./utils.js";

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
    update_old() {
        const nextX = this.x + this.dx;
        const nextY = this.y + this.dy;
        let collides = false;
        for (let y = 0; y < levelHeight; y++) {
            for (let x = 0; x < levelWidth; x++) {
                const tileLeft   = level[x][y].x;
                const tileRight  = level[x][y].x + tileSize;
                const tileTop    = level[x][y].y;
                const tileBottom = level[x][y].y + tileSize;

                if (!isWalkable(x, y) &
                    nextX + (this.w - this.collisionOffset) >= tileLeft &&
                    (nextX + this.collisionOffset) < tileRight &&
                    nextY + (this.h - this.collisionOffset) >= tileTop &&
                    (nextY + this.collisionOffset) < tileBottom
                ) {

                    collides = true;
                }

                if (isDeadly(x, y) &&
                    nextX + (this.w - this.collisionOffset) >= tileLeft &&
                    (nextX + this.collisionOffset) < tileRight &&
                    nextY + (this.h - this.collisionOffset) >= tileTop &&
                    (nextY + this.collisionOffset) < tileBottom
                ) {
                    // Testi
                    if (!this.isDead) {
                        PlayAudio("audio/death01.wav");
                        this.isDead = true;
                        console.info("DEATH BY TILE");
                    }
                }

                // No picking up from just touching the walls
                const pickupOffset = 3;
                if (hasPowerup(x, y) &&
                    nextX + (this.w - this.collisionOffset - pickupOffset) >= tileLeft &&
                    (nextX + this.collisionOffset + pickupOffset) < tileRight &&
                    nextY + (this.h - this.collisionOffset - pickupOffset) >= tileTop &&
                    (nextY + this.collisionOffset + pickupOffset) < tileBottom
                ) {
                    this.powerup.pickup(level[x][y], this);
                }
            }
        }
        //console.log(collides);
        if (!collides) {
            this.x += this.dx;
            this.y += this.dy;
        }
    }
    // Handles movement and collision
    update() {

        const nextX = this.x + this.dx;
        const nextY = this.y + this.dy;
        let collides = false;

        const tile = getTileFromWorldLocation({x: nextX, y: nextY});
        let x = tile.x;
        let y = tile.y;

        if (this.dx < 0) x = tile.x - tileSize; // Left
        if (this.dx > 0) x = tile.x + tileSize; // Right
        if (this.dy < 0) y = tile.y - tileSize; // Up
        if (this.dy > 0) y = tile.y + tileSize; // Down

        const playerTile = getTileFromWorldLocation(this);
        const nextTile = level[x/tileSize][y/tileSize];

        if (Math.abs(this.dx) > 0 || Math.abs(this.dy) > 0) {

            const distance = Math.hypot(this.x - x, this.y - y);

            // Wall
            switch(this.direction) {
                case Direction.UP: {
                    const tileTop = level[playerTile.x/tileSize][(playerTile.y-tileSize)/tileSize];
                    //ctx.fillRect(tileTop.x, tileTop.y, 32, 32);
                    //ctx.fillRect(playerTile.x, playerTile.y, 32, 32);
                    if (nextY - this.h - this.collisionOffset <= tileTop.y)
                        collides = !tileTop.isWalkable;
                    break;
                }
                case Direction.DOWN: {
                    const tileBottom = level[playerTile.x/tileSize][(playerTile.y+tileSize)/tileSize];
                    //ctx.fillRect(tileBottom.x, tileBottom.y, 32, 32);
                    //ctx.fillRect(playerTile.x, playerTile.y, 32, 32);
                    if (nextY + this.h - this.collisionOffset >= tileBottom.y)
                        collides = !tileBottom.isWalkable;
                    break;
                }
                case Direction.LEFT: {
                    const tileLeft = level[(playerTile.x-tileSize)/tileSize][playerTile.y/tileSize];
                    //ctx.fillRect(tileLeft.x, tileLeft.y, 32, 32);
                    //ctx.fillRect(playerTile.x, playerTile.y, 32, 32);
                    if (nextX - this.w - this.collisionOffset <= tileLeft.x)
                        collides = !tileLeft.isWalkable;
                    break;
                }
                case Direction.RIGHT: {
                    const tileRight = level[(playerTile.x+tileSize)/tileSize][playerTile.y/tileSize];
                    //ctx.fillRect(tileRight.x, tileRight.y, 32, 32);
                    //ctx.fillRect(playerTile.x, playerTile.y, 32, 32);
                    if (nextX + this.w - this.collisionOffset >= tileRight.x)
                        collides = !tileRight.isWalkable;
                    break;
                }
            }
            
            if (collides) {
                // Corner points of next tile
                const playerCenter      = {x: this.x + (this.w*0.5), y: this.y + (this.h*0.5)};
                const topLeftCorner     = {x: nextTile.x, y: nextTile.y};
                const topRightCorner    = {x: nextTile.x + tileSize - 4, y: nextTile.y};
                const bottomLeftCorner  = {x: nextTile.x, y: nextTile.y + tileSize - 4};
                const bottomRightCorner = {x: nextTile.x + tileSize - 4, y: nextTile.y + tileSize - 4};

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
                if (distToClosestCorner <= 20) { // TODO: Tweak. n pikseliä kulmasta

                    // Left
                    const lx = (x - tileSize) / tileSize;
                    const ly = y / tileSize;
                    // Right
                    const rx = (x + tileSize) / tileSize;
                    const ry = y / tileSize;
                    // Up
                    const ux = x / tileSize;
                    const uy = (y - tileSize) / tileSize;
                    // Down
                    const dx = x / tileSize;
                    const dy = (y + tileSize) / tileSize;

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

                    const slideSpeed = this.speed * deltaTime;
                    if (this.dx > 0 ) { // Left
                        if (closestCorner == topLeftCorner) {
                            // Top of player
                            const nextToPlayerTile = getTileFromWorldLocation({x: this.x, y: this.y - tileSize});
                            if (upTile.isWalkable && nextToPlayerTile.isWalkable)
                                this.y -= slideSpeed;
                        }

                        if (closestCorner == bottomLeftCorner) {
                            // Bottom of player
                            const nextToPlayerTile = getTileFromWorldLocation({x: this.x, y: this.y + tileSize});
                            if (downTile.isWalkable && nextToPlayerTile.isWalkable)
                                this.y += slideSpeed;
                        }


                    } else if (this.dx < 0) { // Right
                        if (closestCorner == topRightCorner) {
                            // Top of player
                            const nextToPlayerTile = getTileFromWorldLocation({x: this.x, y: this.y - tileSize});
                            if (upTile.isWalkable && nextToPlayerTile.isWalkable)
                                this.y -= slideSpeed;
                        }

                        if (closestCorner == bottomRightCorner) {
                            // Bottom of player
                            const nextToPlayerTile = getTileFromWorldLocation({x: this.x, y: this.y + tileSize});
                            if (downTile.isWalkable && nextToPlayerTile.isWalkable)
                                this.y += slideSpeed;
                        }
                    }

                    if (this.dy > 0) { // Down
                        if (closestCorner == topLeftCorner) {
                            // Left of player
                            const nextToPlayerTile = getTileFromWorldLocation({x: this.x - tileSize, y: this.y});
                            if (leftTile.isWalkable && nextToPlayerTile.isWalkable)
                                this.x -= slideSpeed;
                        }

                        if (closestCorner == topRightCorner) {
                            // Right of player
                            const nextToPlayerTile = getTileFromWorldLocation({x: this.x + tileSize, y: this.y});
                            if (rightTile.isWalkable && nextToPlayerTile.isWalkable)
                                this.y += slideSpeed;
                        }
                    } else if (this.dy < 0) { // Up
                        if (closestCorner == bottomLeftCorner) {
                            // Left of player
                            const nextToPlayerTile = getTileFromWorldLocation({x: this.x - tileSize, y: this.y});
                            if (leftTile.isWalkable && nextToPlayerTile.isWalkable)
                                this.x -= slideSpeed;
                        }

                        if (closestCorner == bottomRightCorner) {
                            // Right of player
                            const nextToPlayerTile = getTileFromWorldLocation({x: this.x + tileSize, y: this.y});
                            if (rightTile.isWalkable && nextToPlayerTile.isWalkable)
                                this.x += slideSpeed;
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
                        game.nextLevel();
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
    // Top left
    P0X: 32,
    P0Y: 32,

    // TODO: levelWidth ja Height ei vielä declaroitu tässä vaiheessa?
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
