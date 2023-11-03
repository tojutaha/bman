import { ctx, level, tileSize, deltaTime, game, deathReasonText, bigBomb, setGlobalPause } from "./main.js";
import { lastLevel, levelHeight, levelType, levelWidth } from "./gamestate.js";
import { getMusicalTimeout, playAudio, playFootsteps, playRiser, randomSfx, sfxs, stopFootsteps } from "./audio.js";
import { Bomb, tilesWithBombs } from "./bomb.js";
import { Powerup } from "./powerup.js";
import { colorTemperatureToRGB, aabbCollision, getTileFromWorldLocation, getSurroundingTiles } from "./utils.js";
import { spriteSheets } from "./spritesheets.js";
import { showGGMenu } from "./page.js";


const godMode = false;

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

////////////////////////////////////////////////////////////////////////////////
// Players
export const players = [];

class Player
{
    constructor(id, startX, startY, keybinds, sprite) {
        // Spawn point
        this.startX = startX || tileSize;
        this.startY = startY || tileSize;

        this.id = id;
        this.x = this.startX;
        this.y = this.startY;
        this.w = tileSize-2;
        this.h = tileSize-2;
        this.dx = 0;
        this.dy = 0;

        this.speed = 150.0; // pixels/s
        this.direction = Direction.RIGHT;
        this.isWalking = false;

        // Key binds
        this.keybinds = keybinds;

        // Collision
        this.collisionW = this.w - 32;
        this.collisionH = this.h - 12;
        this.collisionBox = {x: this.x + 16, y: this.y, w: this.collisionW, h: this.collisionH+10};
        // Powerups
        this.activeBombs = 0;
        this.powerup = new Powerup();

        // Animations
        this.spriteSheet = new Image();
        this.normalSprite = spriteSheets.player_normal;
        this.lanternSprite = spriteSheets.player_lantern;
        this.spriteSheet.src = sprite || this.normalSprite;
        this.frameWidth = 256/4;
        this.frameHeight = 256/4;
        this.totalFrames = 4;
        this.currentFrame = 0;
        this.animationSpeed = 150;
        this.lastTime = 0;

        // HealthPoints
        this.isDead = false;
        this.healthPoints = 3;
        this.updateHealthPoints();

        // "Light"
        this.renderLight = false;
        this.rgb = colorTemperatureToRGB(2600);
        this.rgb2 = colorTemperatureToRGB(3000);
        this.radius = 96;
    }

    onSpawned() {
        if(levelType == "forest_day" || levelType == "hell") {
            this.renderLight = false;
            this.spriteSheet.src = this.normalSprite;
        } else {
            this.renderLight = true;
            this.spriteSheet.src = this.lanternSprite;
        }
    }

    updateHealthPoints() {
        const healthPointsContainer = document.getElementById("healthPointsContainer");
        healthPointsContainer.innerHTML = '';
        for(let i = 0; i < this.healthPoints; i++) {
            const circle = document.createElement("div");
            circle.classList.add("hp-circle");
            healthPointsContainer.appendChild(circle);
        }
    }

    // Handles movement and collision
    update(currentTime) {

        const nextX = this.x + this.dx;
        const nextY = this.y + this.dy;

        const playerTile = getTileFromWorldLocation(this);
        this.collisionBox = {x: nextX + 16, y: nextY, w: this.collisionW, h: this.collisionH+10};

        // If player is dead, dont allow movement
        if (this.isDead) return;

        // Play footsteps
        if (this.dx !== 0.0 || this.dy !== 0.0) {
            playFootsteps(this.isWalking);
            this.isWalking = true;
        } else {
            this.isWalking = false;
            stopFootsteps();
        }

        // Only draw this in darker maps
        if (this.renderLight) {
            // Create radial gradient
            var radialGradient = ctx.createRadialGradient(this.x + this.w / 2,
                this.y + this.h / 2,
                this.radius/4,
                this.x + this.w / 2,
                this.y + this.h / 2,
                this.radius);

            radialGradient.addColorStop(0,   'rgba(' + this.rgb.red + ',' + this.rgb.green + ',' + this.rgb.blue + ',0.5)');
            radialGradient.addColorStop(0.5, 'rgba(' + this.rgb2.red + ',' + this.rgb2.green + ',' + this.rgb2.blue + ',0.35)');
            radialGradient.addColorStop(1,   'rgba(0,0,0,0)');

            // Use the gradient as the fillStyle
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = radialGradient;

            // Draw the circle
            ctx.beginPath();
            ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.radius, 0, Math.PI*2);
            ctx.fill();
        }

        // Animations
        const animDt = currentTime - this.lastTime;
        this.updateAnimation(animDt, currentTime);

        this.drawAnimation();

        const tilesToCheck = getSurroundingTiles(this.collisionBox);

        let collides = false;
        for (let i = 0; i < tilesToCheck.length; i++) {
            const tileBox = {x: tilesToCheck[i].x , y: tilesToCheck[i].y , w: tileSize, h: tileSize};

            if (!tilesToCheck[i].isWalkable && aabbCollision(this.collisionBox, tileBox)) {

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
                if (distToClosestCorner <= 50) { // Pikseliä kulmasta

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
                collides = true;

                if(lastLevel) {
                    stopFootsteps();
                    setGlobalPause(true);
                    showGGMenu();
                } else {
                    game.nextLevel();
                }
            }
        }

        if (playerTile.isDeadly) {
            collides = true;
            this.onDeath(null, true);
        }

        if (!collides) {
            this.x = nextX;
            this.y = nextY;
        }

    }

    updateAnimation(dt, currentTime) {

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

    drawAnimation() {
        switch(this.direction) {
            case Direction.LEFT: {
                ctx.drawImage(this.spriteSheet,
                    this.currentFrame * this.frameWidth, this.frameHeight*3,
                    this.frameWidth, this.frameHeight,
                    this.x, this.y,
                    this.frameWidth, this.frameHeight);
                break;
            }
            case Direction.UP: {
                ctx.drawImage(this.spriteSheet,
                    this.currentFrame * this.frameWidth, 0,
                    this.frameWidth, this.frameHeight,
                    this.x, this.y,
                    this.frameWidth, this.frameHeight);
                break;
            }
            case Direction.DOWN: {
                ctx.drawImage(this.spriteSheet,
                    this.currentFrame * this.frameWidth, this.frameHeight*2,
                    this.frameWidth, this.frameHeight,
                    this.x, this.y,
                    this.frameWidth, this.frameHeight);
                break;
            }
            case Direction.RIGHT:
            {
                    ctx.drawImage(this.spriteSheet,
                        this.currentFrame * this.frameWidth, this.frameHeight,
                        this.frameWidth, this.frameHeight,
                        this.x, this.y,
                        this.frameWidth, this.frameHeight);
                    break;
                }
        }
    }

    dropBomb() {
        if (this.isDead) return;

        if (game.firstBombDropped === false) {
            game.firstBombDropped = true;
            if (game.level > 1) {
                bigBomb.playLightUp();
                playRiser();
            }
        }

        let bombTile = getTileFromWorldLocation(this);

        if (this.activeBombs < this.powerup.maxBombs) {
            if (!bombTile.bomb || bombTile.bomb.hasExploded) {
                bombTile.bomb = new Bomb(bombTile.x, bombTile.y, this.powerup.maxRange, this.id);
                this.activeBombs++;
                tilesWithBombs.push(bombTile);
                
                // Checks whether any player is still standing on the bomb after it was dropped.
                let posCheck = setInterval(() => {
                    let isPlayerOnBomb = false;
                    // NOTE: Ei tarkisteta mahdollisia muita pelaajia!
                    if(aabbCollision(bombTile.bomb.collisionBox, this.collisionBox)) {
                        isPlayerOnBomb = true;
                    }
                    if (this.isDead) {
                        bombTile.isWalkable = true;
                        bombTile.isDeadly = false;
                        clearInterval(posCheck);
                    }
                    if (!isPlayerOnBomb) {
                        bombTile.isWalkable = false;
                        clearInterval(posCheck);
                    }
                }, 1);
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

    onDeath(enemyWhoKilled, wasBomb) {
        if (godMode) return;

        if (!this.isDead) {
            this.isDead = true;
            this.healthPoints--;
            this.updateHealthPoints();
            // Save the game state here, so we can save healthpoints
            game.saveGame();
            
            // Audio
            stopFootsteps();
            playAudio(sfxs['DEATH']);
            if (game.level > 1) {
                let delay = getMusicalTimeout();
                setTimeout(() => {
                    let randomLaugh;
                    if (game.level === 1) {
                        randomLaugh = randomSfx(sfxs['LAUGHS']);
                    } else {
                        randomLaugh = randomSfx(sfxs['SYNCED_LAUGHS']);
                    }
                    playAudio(randomLaugh);
                }, delay);
            }

            if(this.healthPoints <= 0) {
                game.over();
            } else {
                // Play text animation
                if(enemyWhoKilled) {
                    deathReasonText.playAnimation(`Killed by ${enemyWhoKilled.enemyType}`);
                } else if(wasBomb) {
                    deathReasonText.playAnimation("Killed by bomb");
                }

                game.restartLevel();
            }
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

export function resetPlayerPositions()
{
    players.forEach((p) => {
        p.x = p.startX;
        p.y = p.startY;
        p.onSpawned();
    });
}

export function spawnPlayers()
{
    // NOTE: startX, startY = null menee aina vasempaan yläkulmaan tileSizen mukaan
    players.push(new Player(0, null, null, keybinds1, "./assets/player0.png"));
    // players.push(new Player(1, (levelWidth-2)*tileSize, (levelHeight-2)*tileSize, keybinds2));
    for (let i = 0; i < players.length; i++) {
        document.addEventListener("keyup", function(event) {
            players[i].handleKeyUp(event);
        });
        document.addEventListener("keydown", function(event) {
            players[i].handleKeyDown(event);
        });

        players[i].onSpawned();
    }
};

export function clearPlayers() {
    players.forEach(p => {
        for(let prop in p) {
            p[prop] = null;
        }
    });

    players.length = 0;
}
