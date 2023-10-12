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

export function renderPlayer(timeStamp)
{
    players.forEach(p => {
        // NOTE: Nämä spritet piirretään nyt updateAnimation funktiossa
        p.update(timeStamp);
    });
}

function colorTemperatureToRGB(kelvin)
{
    var temp = kelvin / 100;
    var red, green, blue;

    if(temp <= 66) {
        red = 255;
        green = temp;
        green = 99.4708025861 * Math.log(green) - 161.1195681661;
    } else {
        red = temp - 60;
        red = 329.698727446 * Math.pow(red, -0.1332047592);
        green = temp - 60;
        green = 288.1221695283 * Math.pow(green, -0.0755148492);
    }

    if(temp >= 66) {
        blue = 255;
    } else if(temp <= 19) {
        blue = 0;
    } else {
        blue = temp - 10;
        blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
    }

    return {
        red : clamp(red, 0, 255),
        green : clamp(green, 0, 255),
        blue : clamp(blue, 0, 255)
    }
}

function clamp(x, min, max)
{
    if(x<min) return min;
    if(x>max) return max;
    return x;
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

        this.collisionW = this.w - 32;
        this.collisionH = this.h - 12;

        // Key binds
        this.keybinds = keybinds;

        // Powerups
        this.activeBombs = 0;
        this.powerup = new Powerup();

        // Animations
        this.spriteSheet = new Image();
        this.spriteSheet.src = "./assets/player0_placeholder.png"; // TODO: Muuttujaksi, jos useampi pelaaja.
        this.mirroredFrames = [];
        this.frameWidth = 128/4;
        this.frameHeight = 64;
        this.totalFrames = 4;
        this.currentFrame = 0;
        this.animationSpeed = 150; // TODO: Tweak
        this.lastTime = 0;

        this.spriteSheet.onload = () => {
            for (let i = 0; i < this.totalFrames; i++) {
                const mirroredCanvas = document.createElement('canvas');
                mirroredCanvas.width = this.frameWidth;
                mirroredCanvas.height = this.frameHeight;
                const mirroredCtx = mirroredCanvas.getContext('2d');
                mirroredCtx.scale(-1, 1);
                mirroredCtx.drawImage(
                    this.spriteSheet,
                    i * this.frameWidth,
                    0,
                    this.frameWidth,
                    this.frameHeight,
                    -this.frameWidth,
                    0,
                    this.frameWidth,
                    this.frameHeight
                );
                this.mirroredFrames.push(mirroredCanvas);
            }
        }
    }

    // Handles movement and collision
    update(currentTime) {

/////

        // Create radial gradient
        var rgb = colorTemperatureToRGB(2600);
        var rgb2 = colorTemperatureToRGB(3000);
        var radius = 96;
        var radialGradient = ctx.createRadialGradient(this.x + this.w / 2,
                                                      this.y + this.h / 2,
                                                      radius/4,
                                                      this.x + this.w / 2,
                                                      this.y + this.h / 2,
                                                      radius);

        radialGradient.addColorStop(0,   'rgba(' + rgb.red + ',' + rgb.green + ',' + rgb.blue + ',0.5)');
        radialGradient.addColorStop(0.5, 'rgba(' + rgb2.red + ',' + rgb2.green + ',' + rgb2.blue + ',0.35)');
        radialGradient.addColorStop(1,   'rgba(0,0,0,0)');

        // Use the gradient as the fillStyle
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = radialGradient;

        // Draw the circle
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, radius, 0, Math.PI*2);
        ctx.fill();
/////

        const nextX = this.x + this.dx;
        const nextY = this.y + this.dy;

        const playerTile = getTileFromWorldLocation(this);
        const playerBox = {x: nextX + 16, y: nextY + 8, w: this.collisionW, h: this.collisionH};
        //ctx.fillRect(playerBox.x, playerBox. y, playerBox.w, playerBox.h);

        // Animations
        const animDt = currentTime - this.lastTime;
        this.updateAnimation(animDt, currentTime);

        // TODO: Muut suunnat?

        if (this.dx < 0) {
            ctx.drawImage(this.mirroredFrames[this.currentFrame], this.x + tileSize/4, this.y);
        } else {
            ctx.drawImage(this.spriteSheet,
                this.currentFrame * this.frameWidth, 0,
                this.frameWidth, this.frameHeight,
                this.x + tileSize/4, this.y,
                this.frameWidth, this.frameHeight);
        }

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

                // TODO: Tämän pitäisi varmaan olla liikkumisssuunnasta riippuen joku tietty kulma, eikä keskeltä pelaajaa(?)
                const distToClosestCorner = Math.hypot(playerCenter.x - closestCorner.x, playerCenter.y - closestCorner.y);
                if (distToClosestCorner <= 50) { // TODO: Tweak. n pikseliä kulmasta

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

                    const slideSpeed = this.speed * deltaTime;
                    if (this.dx > 0 ) { // Left
                        if (closestCorner == topLeftCorner) {
                            // Top of player
                            const nextToPlayer = getTileFromWorldLocation({x: tile.x - tileSize, y: tile.y - tileSize});
                            if (upTile.isWalkable && nextToPlayer.isWalkable) {  
                                this.y -= slideSpeed;
                            }
                        }

                        if (closestCorner == bottomLeftCorner) {
                            // Bottom of player
                            const nextToPlayer = getTileFromWorldLocation({x: tile.x - tileSize, y: tile.y + tileSize});
                            if (downTile.isWalkable && nextToPlayer.isWalkable) {
                                this.y += slideSpeed;
                            }
                        }


                    } else if (this.dx < 0) { // Right
                        if (closestCorner == topRightCorner) {
                            // Top of player
                            const nextToPlayer = getTileFromWorldLocation({x: tile.x + tileSize, y: tile.y - tileSize});
                            if (upTile.isWalkable && nextToPlayer.isWalkable) {
                                this.y -= slideSpeed;
                            }
                        }

                        if (closestCorner == bottomRightCorner) {
                            // Bottom of player
                            const nextToPlayer = getTileFromWorldLocation({x: tile.x + tileSize, y: tile.y + tileSize});
                            if (downTile.isWalkable && nextToPlayer.isWalkable) {
                                this.y += slideSpeed;
                            }
                        }
                    }

                    if (this.dy > 0) { // Down
                        if (closestCorner == topLeftCorner) {
                            // Left of player
                            const nextToPlayer = getTileFromWorldLocation({x: tile.x - tileSize, y: tile.y - tileSize});
                            if (leftTile.isWalkable && nextToPlayer.isWalkable) {
                                this.x -= slideSpeed;
                            }
                        }

                        if (closestCorner == topRightCorner) {
                            // Right of player
                            const nextToPlayer = getTileFromWorldLocation({x: tile.x + tileSize, y: tile.y - tileSize});
                            if (rightTile.isWalkable && nextToPlayer.isWalkable) {
                                this.x += slideSpeed;
                            }
                        }
                    } else if (this.dy < 0) { // Up
                        if (closestCorner == bottomLeftCorner) {
                            // Left of player
                            const nextToPlayer = getTileFromWorldLocation({x: tile.x - tileSize, y: tile.y + tileSize});
                            if (leftTile.isWalkable && nextToPlayer.isWalkable) {
                                this.x -= slideSpeed;
                            }
                        }

                        if (closestCorner == bottomRightCorner) {
                            // Right of player
                            const nextToPlayer = getTileFromWorldLocation({x: tile.x + tileSize, y: tile.y + tileSize});
                            if (rightTile.isWalkable && nextToPlayer.isWalkable) {
                                this.x += slideSpeed;
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
            if (playerTile.isOpen) {
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

    updateAnimation(dt, currentTime) {
        if (isNaN(dt)) return;

        if (this.dx === 0 && this.dy === 0) {
            this.currentFrame = 0;
            return;
        }

        if (dt >= this.animationSpeed) {
            this.currentFrame++;
            if (this.currentFrame >= this.totalFrames) {
                this.currentFrame = 0;
            }
            this.lastTime = currentTime;
        }
    }

    // Bomb
    dropBomb() {
        // TODO: Näkymättömät pommit (tarpeellinen vain jos 2+ pelaajaa tai jos tehdään co-op)
        // -> tulee jos seisoo pommin päällä loppuun asti
        // EHKÄ: Pakota menemään vain suuntaan johon lähdetään kävelemään
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
                        if (getDistanceTo(bombTile, players[i]) <= tileSize+10) {
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

        switch(event.code) {
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

        switch(event.code) {
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
    move_up: "KeyW",
    move_down: "KeyS",
    move_left: "KeyA",
    move_right: "KeyD",
    drop_bomb: "Space",
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
