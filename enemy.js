import { canvas, ctx, deltaTime, game, level, levelHeight, levelWidth, tileSize } from "./main.js";
import { Direction, players } from "./player.js";
import { lerp, getDistanceTo, getRandomWalkablePointInRadius, getTileFromWorldLocation, isWalkable } from "./utils.js";
import { requestPath } from "./pathfinder.js";
import { tilesWithBombs } from "./bomb.js";
import { PlayAudio } from "./audio.js";

export const enemyType = {
    ZOMBIE: "Zombie",
    GHOST: "Ghost",
    SKELETON: "Skeleton",
}

export const movementMode = {
    IDLE: "Idle",
    ROAM: "Roam",
    PATROL: "Patrol",
    FOLLOW: "Follow",
}

class Enemy
{
    static lastId = 0;

    constructor(x, y, w, h, newMovementMode, speed, type) {
        this.id = ++Enemy.lastId;
        this.justSpawned = true;

        // Coordinates
        this.x  = x;
        this.y  = y;

        // Size
        this.w  = w;
        this.h  = h;

        // Movement
        this.isMoving = false;
        this.useDiagonalMovement = false;
        this.movementMode = newMovementMode || movementMode.ROAM;
        this.speed = speed || 500;
        this.direction = Direction.UP;
        this.timer = null;

        // Behaviour
        this.enemyType = type || enemyType.ZOMBIE;
        this.currentPath = [];
        this.startLocation = {x: this.x, y: this.y};
        this.targetLocation = {x: 0, y: 0};
        this.playerTarget = null;

        // Rendering
        this.renderX = this.x;
        this.renderY = this.y;
        this.t = 0;

        // Animations
        this.spriteSheet = new Image();
        this.frameWidth = 192/3;
        this.frameHeight = 256/4;
        this.totalFrames = 3;
        this.currentFrame = 0;
        this.animationSpeed = 150; // TODO: Tweak
        this.lastTime = 0;

    }

    init() {

        switch(this.enemyType) {
            case enemyType.ZOMBIE: {
                // TODO: Oikea sprite tälle.
                this.spriteSheet.src = "./assets/placeholder_zombi.png";
                this.movementMode = movementMode.PATROL;
                this.patrol();
                break;
            }
            case enemyType.GHOST: {
                this.spriteSheet.src = "./assets/ghost_01.png";
                this.movementMode = movementMode.ROAM;
                this.roam();
                break;
            }
            case enemyType.SKELETON: {
                this.spriteSheet.src = "./assets/skeleton_01.png";
                this.movementMode = movementMode.FOLLOW;
                this.followPlayer();
                break;
            }
        }
        
        if (this.justSpawned) {
            this.spawnImmortality = setTimeout(() => {
                this.justSpawned = false;
            }, 2000);
    
            // game.increaseEnemies();
        }
    }

    getLocation() {
        return {x: this.x, y: this.y};
    }

    getRandomPath() {
        const maxRadius = 12*tileSize;
        const minRadius = 4*tileSize;
        const targetLocation = 
        getRandomWalkablePointInRadius({x: this.x, y: this.y},
                                        minRadius, maxRadius);
        this.targetLocation = {x: targetLocation.x, y: targetLocation.y};
    }

    getRandomPlayer() {
        const index = Math.floor(Math.random() * players.length);
        return players[index];
    }

    getPlayerLocation() {
        if (!this.playerTarget) {
            this.playerTarget = this.getRandomPlayer();
            const tile = getTileFromWorldLocation(this.playerTarget);
            this.targetLocation = {x: tile.x, y: tile.y};
        } else {
            const tile = getTileFromWorldLocation(this.playerTarget);
            this.targetLocation = {x: tile.x, y: tile.y};
        }
    }

    startMove() {
        this.timer = null;

        if (!this.currentPath) {
            // console.log("Trying again..");
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }

            setTimeout(() => {
                this.init();
            }, 3000);
            return;
        }

        let index = 0;
        let renderIndex = index + 1;
        this.timer = setInterval(() => {

            this.isMoving = true;

            const next = this.currentPath[index];

            // Check if there is a bomb on the path
            const nextInRender = this.currentPath[renderIndex]
            if (nextInRender !== undefined) {
                const bombCoords = tilesWithBombs.find(bomb => bomb.x === nextInRender.x && bomb.y === nextInRender.y);
                if (bombCoords) {
                    this.x = next.x;
                    this.y = next.y;
                    clearInterval(this.timer);
                    this.currentPath.length = 0;
                }
            }
            
            // Move enemy
            this.x = next.x;
            this.y = next.y;
            this.t = 0;

            // Check if enemy has reached one of the players
            players.forEach(player => {
                if (getDistanceTo(this, player) < tileSize) {
                    player.onDeath();
                    this.playerTarget = null;
                    clearInterval(this.timer);
                    this.isMoving = false;
                }
            });

            // Smoother movement for rendering
            if (this.currentPath) {
                if (renderIndex < this.currentPath.length) {
                    const renderLoc = this.currentPath[renderIndex]
                    this.renderX = renderLoc.x;
                    this.renderY = renderLoc.y;
                    renderIndex++;
                }
            } else return;

            index++;

            //console.log("real location :", this.x, this.y);
            //console.log("render location :", this.renderX, this.renderY);

            if (index >= this.currentPath.length) {

                clearInterval(this.timer);
                this.isMoving = false;
                switch(this.movementMode) {
                    case movementMode.IDLE:
                        // Nothing to do
                        this.currentPath.length = 0;
                        break;
                    case movementMode.ROAM:
                        // Randomly roam around map
                        this.currentPath.length = 0;
                        this.roam();
                        break;
                    case movementMode.PATROL:
                        // Patrol between two points
                        this.patrol();
                        break;
                    case movementMode.FOLLOW:
                        // Follow player
                        this.currentPath.length = 0;
                        this.followPlayer();
                        break;
                }
            }

        }, this.speed);
    }

    roam() {
        this.getRandomPath();
        requestPath(this, this.getLocation(), this.targetLocation);
    }

    patrol() {
        if (!this.currentPath || this.currentPath.length == 0) {
            this.getRandomPath();
            requestPath(this, this.getLocation(), this.targetLocation);
        } else {
            const temp = this.startLocation;
            this.startLocation = this.targetLocation;
            this.targetLocation = temp;
            this.currentPath.reverse();
            this.startMove();
        }
    }

    followPlayer() {
        this.getPlayerLocation();
        requestPath(this, this.getLocation(), this.targetLocation);
    }

    die() {

        // TODO: Oikeat scoret tänne
        switch(this.enemyType) {
            case enemyType.ZOMBIE: {
                game.increaseScore(500);
                break;
            }
            case enemyType.GHOST: {
                game.increaseScore(1000);
                break;
            }
            case enemyType.SKELETON: {
                game.increaseScore(1500);
                break;
            }
        }

        let result = findEnemyById(this.id);
        console.log("ID:", result);
        enemies.splice(result.index, 1);

        this.movementMode = movementMode.IDLE;
        clearInterval(this.timer);

        for (let prop in this) {
            // console.log("nullifying", prop);
            this[prop] = null;
        }

        game.decreaseEnemies();
    }

    update(currentTime, x, y) {

        // Animations
        const animDt = currentTime - this.lastTime;
        if (animDt >= this.animationSpeed) {
            this.currentFrame++;
            if (this.currentFrame >= this.totalFrames) {
                this.currentFrame = 0;
            }
            this.lastTime = currentTime;
        }

        if (this.isMoving) {
            this.drawAnimation(x, y);
        } else {
            this.currentFrame = 0;
            this.drawAnimation(x, y);
        }
    }

    drawAnimation(x, y) {
        switch(this.direction) {
            case Direction.LEFT: {
                ctx.drawImage(this.spriteSheet,
                    this.currentFrame * this.frameWidth, this.frameHeight*3,
                    this.frameWidth, this.frameHeight,
                    x, y,
                    this.frameWidth, this.frameHeight);
                break;
            }
            case Direction.UP: {
                ctx.drawImage(this.spriteSheet,
                    this.currentFrame * this.frameWidth, 0,
                    this.frameWidth, this.frameHeight,
                    x, y,
                    this.frameWidth, this.frameHeight);
                break;
            }
            case Direction.DOWN: {
                ctx.drawImage(this.spriteSheet,
                    this.currentFrame * this.frameWidth, this.frameHeight*2,
                    this.frameWidth, this.frameHeight,
                    x, y,
                    this.frameWidth, this.frameHeight);
                break;
            }
            case Direction.RIGHT:
            {
                    ctx.drawImage(this.spriteSheet,
                        this.currentFrame * this.frameWidth, this.frameHeight,
                        this.frameWidth, this.frameHeight,
                        x, y,
                        this.frameWidth, this.frameHeight);
                    break;
                }
        }
    }
};

function getRandomSpeed()
{
    const max = 500;
    const min = 350;
    const random = Math.random() * (max - min) + min;
    return Math.floor(random);
}

export let enemies = [];
// Initial spawn
export function spawnEnemies()
{
    // game.fetchLevelData()
    // .then(data => {
    //     let total = data.zombies + data.ghosts + data.skeletons;
    //     console.log(
    //         "Ghosts:", data.ghosts, 
    //         "Zombies:", data.zombies, 
    //         "Skeletons:", data.skeletons,
    //         "Total:", total);
    // })
    // .catch(error => {
    //     console.error("Couldn't fetch the enemies from levels.json");
    // });

    
    const typeValues = Object.values(enemyType);
    const amount = typeValues.length;
    //const amount = 1;
    const maxRadius = 25*tileSize;
    const minRadius = 10*tileSize;

    // TODO: Muut pelaajat?
    const player = players[0];
    for (let i = 0; i < amount; i++) {
        const random = getRandomWalkablePointInRadius({x: player.x,
                                                       y: player.y},
                                                       minRadius, maxRadius);
        const enemy = new Enemy(random.x, random.y, tileSize, tileSize);
        let typeIndex = i;
        enemy.enemyType = typeValues[typeIndex];
        enemy.speed = getRandomSpeed(); // TODO: Pitäiskö määritellä nopeudet tyypin mukaan?
        enemy.init();
        enemies.push(enemy);

        if (typeIndex > typeValues.length) {
            typeIndex = 0;
        }
    }
}

// Spawn enemies at location
export function spawnEnemiesAtLocation(location, amount = 1)
{
    for (let i = 0; i < amount; i++) {
        const enemy = new Enemy(location.x, location.y, tileSize, tileSize);
        enemy.speed = getRandomSpeed();
        enemy.init();
        enemies.push(enemy);
    }
}

// Finds an enemy with given id, 
// and returns it and the array index where its stored.
export function findEnemyById(id) {
    let index = enemies.findIndex(enemy => enemy.id === id);
    return {enemy: enemies[index], index};
}

export function renderEnemies(timeStamp)
{
    if (isNaN(deltaTime)) {
        return;
    }

    enemies.forEach(enemy => {
        if (enemy) {

            // Store movement direction
            if (enemy.renderX < enemy.x) {
                enemy.direction = Direction.LEFT;
            } else if (enemy.renderX > enemy.x) {
                enemy.direction = Direction.RIGHT;
            }

            if (enemy.renderY < enemy.y) {
                enemy.direction = Direction.UP;
            } else if (enemy.renderY > enemy.y) {
                enemy.direction = Direction.DOWN;
            }

            // Smooth rendering
            enemy.t += deltaTime * (1 / (enemy.speed / 1000));
            enemy.t = Math.min(enemy.t, 1); // NEED TO CLAMP THIS ONE TOO!

            const x = lerp(enemy.x, enemy.renderX, enemy.t);
            const y = lerp(enemy.y, enemy.renderY, enemy.t);

            enemy.update(timeStamp, x, y);
        }
    });
}