import { ctx, level, tileSize, fixedDeltaTime, game, deathReasonText, setGlobalPause, isMultiplayer } from "./main.js";
import { lastLevel, levelHeight, levelType, levelWidth } from "./gamestate.js";
import { getMusicalTimeout, playAudio, playFootsteps, playTrack, randomSfx, sfxs, stopFootsteps, tracks } from "./audio.js";
import { Bomb, tilesWithBombs } from "./bomb.js";
import { Powerup, pickupMushroom } from "./pickups.js";
import { colorTemperatureToRGB, aabbCollision, getTileFromWorldLocation, getSurroundingTiles, clamp } from "./utils.js";
import { spriteSheets } from "./spritesheets.js";
import { showGGMenu } from "./page.js";


export let godMode = false;
export function toggleGodMode() {
    godMode = !godMode
}

export const playerSpeed = 150;

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
    constructor(id, startX, startY, keybinds, normalSprite, lanternSprite, mushroomedSprite) {
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

        this.speed = playerSpeed; // pixels/s
        this.originalSpeed = this.speed;
        this.direction = Direction.DOWN;
        this.isWalking = false;

        // Key binds
        this.keybinds = keybinds;
        this.moveUpPressed = false;
        this.moveDownPressed = false;
        this.moveLeftPressed = false;
        this.moveRightPressed = false;

        // Event listener handles
        this.keyUpHandler = null;
        this.keyDownHandler = null;

        // Collision
        this.collisionW = this.w - 32;
        this.collisionH = this.h - 12;
        this.collisionBox = {x: this.x + 16, y: this.y, w: this.collisionW, h: this.collisionH+10};
        // Powerups
        this.activeBombs = 0;
        this.powerup = new Powerup();

        // Animations
        this.spriteSheet = new Image();
        this.normalSprite = normalSprite;
        this.lanternSprite = lanternSprite;
        this.mushroomedSprite = mushroomedSprite;
        this.spriteSheet.src = this.normalSprite;
        this.frameWidth = 256/4;
        this.frameHeight = 288/4;
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
            healthPointsContainer.innerHTML += '♥';
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
        if(!isMultiplayer)
        {
            if (this.dx !== 0.0 || this.dy !== 0.0) {
                playFootsteps(this.isWalking);
                this.isWalking = true;
            } else {
                this.isWalking = false;
                stopFootsteps();
            }
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

            // Exit the loop early if player stands on deadly tile.
            if(playerTile.isDeadly) {
                break;
            }

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

                    const slideSpeed = this.speed * fixedDeltaTime;
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

        if (playerTile.hasMushroom) {
            pickupMushroom(playerTile, this);
        }

        if (playerTile.isExit) {
            if (playerTile.isOpen) {
                collides = true;

                if(lastLevel) {
                    stopFootsteps();
                    playTrack(tracks['SLOWHEART']);
                    playAudio(sfxs['VICTORY']);
                    setGlobalPause(true);
                    showGGMenu();
                } else {
                    game.nextLevel();
                }
            }
        }

        if (playerTile.isDeadly) {
            collides = true;
            const instigator = playerTile.instigatedBy;
            this.onDeath(null, true, instigator);
        }

        if (!collides) {
            this.x += this.dx;
            this.y += this.dy;
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

        let bombTile = getTileFromWorldLocation(this);

        if (this.activeBombs < this.powerup.maxBombs) {
            if (!bombTile.bomb || bombTile.bomb.hasExploded) {
                bombTile.bomb = new Bomb(bombTile.x, bombTile.y, this.powerup.maxRange, this.id);
                this.activeBombs++;
                tilesWithBombs.push(bombTile);
                
                // Checks whether any player is still standing on the bomb after it was dropped.
                let posCheck = setInterval(() => {
                    let arePlayersOnBomb = false;

                    if(bombTile.bomb.hasExploded) {
                        bombTile.isWalkable = true;
                        clearInterval(posCheck);
                    }

                    players.forEach(p => {
                        if (aabbCollision(bombTile.bomb.collisionBox, p.collisionBox)) {
                            arePlayersOnBomb = true;
                        }
                        if (p.isDead) {
                            bombTile.isWalkable = true;
                            bombTile.isDeadly = false;
                            clearInterval(posCheck);
                        }
                    });
                    if (!arePlayersOnBomb) {
                        bombTile.isWalkable = false;
                        clearInterval(posCheck);
                    }
                }, 1);
            }
        }
    }

    buildWall() {
        if(this.isDead) return;

        if(isMultiplayer) {
            if(this.powerup.currentWalls > 0)
            {
                playAudio(sfxs['BUILD1']);
                this.powerup.currentWalls--;
                this.powerup.currentWalls = clamp(this.powerup.currentWalls, 0, this.powerup.maxWalls);
                
                let tile = getTileFromWorldLocation(this);
                const x = tile.x / tileSize;
                const y = tile.y / tileSize;
                level[x][y].type = "SoftWall";

                // Checks whether any player is still standing on the tile after it was dropped.
                let posCheck = setInterval(() => {
                    let arePlayersOnTile = false;

                    if(tile.type == "Floor") {
                        tile.isWalkable = true;
                        clearInterval(posCheck);
                    }

                    const collisionBox = { x: tile.x, y: tile.y, w: tileSize, h: tileSize };

                    players.forEach(p => {
                        if (aabbCollision(collisionBox, p.collisionBox)) {
                            arePlayersOnTile = true;
                        }
                        if (p.isDead) {
                            tile.isWalkable = true;
                            tile.isDeadly = false;
                            clearInterval(posCheck);
                        }
                    });
                    if (!arePlayersOnTile) {
                        tile.isWalkable = false;
                        clearInterval(posCheck);
                    }
                }, 1);
            }
        }
    }

    // Movement
    moveUp() {
        this.moveUpPressed = true;
        this.dy = -this.speed * fixedDeltaTime;
        this.dx = 0;
        this.direction = Direction.UP;
    }

    moveLeft() {
        this.moveLeftPressed = true;
        this.dx = -this.speed * fixedDeltaTime;
        this.dy = 0;
        this.direction = Direction.LEFT;
    }

    moveDown() {
        this.moveDownPressed = true;
        this.dy = this.speed * fixedDeltaTime;
        this.dx = 0;
        this.direction = Direction.DOWN;
    }

    moveRight() {
        this.moveRightPressed = true;
        this.dx = this.speed * fixedDeltaTime;
        this.dy = 0;
        this.direction = Direction.RIGHT;
    }

    // Inputs
    handleKeyDown(event) {
        event.preventDefault();

        switch(event.code) {
            case this.keybinds.move_up:
                this.moveUp();
                break;

            case this.keybinds.move_left:
                this.moveLeft();
                break;

            case this.keybinds.move_down:
                this.moveDown();
                break;

            case this.keybinds.move_right:
                this.moveRight();
                break;

            case this.keybinds.drop_bomb:
                this.dropBomb();
                break;

            case this.keybinds.build:
                this.buildWall();
                break;
        }
    }

    handleKeyUp(event) {
        event.preventDefault();

        switch(event.code) {
            case this.keybinds.move_up:
                this.moveUpPressed = false;
                //this.dy = 0;
                break;
            case this.keybinds.move_down:
                this.moveDownPressed = false;
                //this.dy = 0;
                break;

            case this.keybinds.move_left:
                this.moveLeftPressed = false;
                //this.dx = 0;
                break;
            case this.keybinds.move_right:
                this.moveRightPressed = false;
                //this.dx = 0;
                break;
        }

        if(!this.moveRightPressed && !this.moveLeftPressed) {
            this.dx = 0;
        }
        if(!this.moveUpPressed && !this.moveDownPressed) {
            this.dy = 0;
        }
    }

    // Mobile controls
    bindMobile() {
        document.getElementById("mob-dir-up").addEventListener("touchstart", (event) => {
          event.preventDefault();
          this.moveUp();
        });
        document.getElementById("mob-dir-up").addEventListener("touchend", (event) => { 
            event.preventDefault(); 
            this.dy = 0; 
        });
        document.getElementById("mob-dir-down").addEventListener("touchstart", (event) => { 
            event.preventDefault(); 
            this.moveDown() 
        });
        document.getElementById("mob-dir-down").addEventListener("touchend", (event) => { 
            event.preventDefault(); 
            this.dy = 0; 
        });
        document.getElementById("mob-dir-right").addEventListener("touchstart", (event) => { 
            event.preventDefault(); 
            this.moveRight() 
        });
        document.getElementById("mob-dir-right").addEventListener("touchend", (event) => { 
            event.preventDefault(); 
            this.dx = 0; 
        });
        document.getElementById("mob-dir-left").addEventListener("touchstart", (event) => { 
            event.preventDefault(); 
            this.moveLeft() 
        });
        document.getElementById("mob-dir-left").addEventListener("touchend", (event) => { 
            event.preventDefault(); 
            this.dx = 0; 
        });
        document.getElementById("mob-bomb").addEventListener("touchstart", (event) => {
          event.preventDefault();
          this.dropBomb();
        });
    }
      

    // NOTE: Instigator mahdollisesti validi ainoastaan pvp-modessa
    onDeath(enemyWhoKilled, wasBomb, instigator) {
        if (godMode) return;

        if(isMultiplayer) {
            if (!this.isDead) {
                playAudio(sfxs['DEATH']);
                this.isDead = true;

                game.updateScore(this.id, instigator, enemyWhoKilled);
                game.restartLevel();
            }
        } else {
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
                        randomLaugh = randomSfx(sfxs['LAUGHS']);
                        playAudio(randomLaugh);
                    }, delay);
                }

                if (this.healthPoints <= 0) {
                    game.over();
                } else {
                    // Play text animation
                    if (enemyWhoKilled) {
                        deathReasonText.playAnimation(`Killed by a ${enemyWhoKilled.enemyType}`);
                    } else if (wasBomb) {
                        deathReasonText.playAnimation("Killed by a bomb");
                    }

                    game.restartLevel();
                }
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
    build: "KeyE",
};

export const keybinds2 = {
    move_up: "ArrowUp",
    move_down: "ArrowDown",
    move_left: "ArrowLeft",
    move_right: "ArrowRight",
    drop_bomb: "Enter",
    build: "Backspace"
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

export function spawnPlayers(amount = 1)
{
    if(amount == 1) {
        // NOTE: startX, startY = null menee aina vasempaan yläkulmaan tileSizen mukaan
        players.push(new Player(0, null, null, keybinds1, spriteSheets.player1_normal, spriteSheets.player1_lantern, spriteSheets.player1_mushroom_effect));
        players[0].bindMobile();
    } else {
        players.push(new Player(0, null, null, keybinds1, spriteSheets.player1_normal, spriteSheets.player1_lantern, spriteSheets.player1_mushroom_effect));
        players.push(new Player(1, (levelWidth - 2) * tileSize, (levelHeight - 2) * tileSize, keybinds2, spriteSheets.player2_normal, spriteSheets.player2_lantern));
    }

    for (let i = 0; i < players.length; i++) {
        players[i].keyUpHandler = function(event) {
            players[i].handleKeyUp(event);
        };

        players[i].keyDownHandler = function(event) {
            players[i].handleKeyDown(event);
        };

        document.addEventListener("keyup", players[i].keyUpHandler);
        document.addEventListener("keydown", players[i].keyDownHandler);

        players[i].onSpawned();
    }
};

export function clearPlayers() {
    players.forEach(p => {
        document.removeEventListener("keyup", p.keyUpHandler);
        document.removeEventListener("keydown", p.keyDownHandler);
        for(let prop in p) {
            p[prop] = null;
        }
    });

    players.length = 0;
}

