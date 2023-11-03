import { ctx, deltaTime, game, globalPause, tileSize } from "./main.js";
import { Direction, players } from "./player.js";
import { dfs, lerp, getRandomWalkablePointInRadius, getTileFromWorldLocation, aabbCollision, getDistanceToEuclidean } from "./utils.js";
import { requestPath } from "./pathfinder.js";
import { tilesWithBombs } from "./bomb.js";
import { playAudio, randomSfx, sfxs } from "./audio.js";
import { EnemyDeathAnimation, deathRow } from "./animations.js";
import { spriteSheets } from "./spritesheets.js";

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

// Määrittelee kuinka monen tilen päästä enemy koettaa
// hakea polkua maksimissaaan
const maxPathLength = 16;

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
        this.previousMovementMode = this.movementMode;
        this.speed = speed || 500;
        this.direction = Direction.UP;
        this.timer = null;
        this.next = [];

        // Collision
        this.collides = false;
        this.collisionW = this.w - 32;
        this.collisionH = this.h - 12;
        this.collisionBox = {x: this.x + 16, y: this.y, w: this.collisionW, h: this.collisionH+10};

        // Behaviour
        this.enemyType = type || enemyType.ZOMBIE;
        this.currentPath = [];
        this.startLocation = {x: this.x, y: this.y};
        this.targetLocation = {x: 0, y: 0};
        this.playerTarget = null;
        this.isChasingPlayer = false;

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
        this.animationSpeed = 150;
        this.lastTime = 0;

        // Should only be true for enemies that spawn from door!
        this.spawnedFromDoor = false;
    }

    init() {

        switch(this.enemyType) {
            case enemyType.ZOMBIE: {
                this.totalFrames = 4;
                this.frameWidth = 256/4;
                this.spriteSheet.src = spriteSheets.zombie;
                this.movementMode = movementMode.PATROL;
                this.speed = 800;
                this.patrol();
                break;
            }
            case enemyType.GHOST: {
                this.spriteSheet.src = spriteSheets.ghost;
                this.movementMode = movementMode.ROAM;
                this.speed = 500;
                this.roam();
                break;
            }
            case enemyType.SKELETON: {
                this.spriteSheet.src = spriteSheets.skeleton;
                this.movementMode = movementMode.PATROL;
                this.speed = 400;
                this.patrol();
                break;
            }
        }
        
        if (this.justSpawned) {
            this.spawnImmortality = setTimeout(() => {
                this.justSpawned = false;
            }, 2000);
        }
    }

    showSprite() {
        switch(this.enemyType) {
            case enemyType.ZOMBIE: {
                this.spriteSheet.src = spriteSheets.zombie;
                break;
            }
            case enemyType.GHOST: {
                this.spriteSheet.src = spriteSheets.ghost;
                break;
            }
            case enemyType.SKELETON: {
                this.spriteSheet.src = spriteSheets.skeleton;
                break;
            }
        }
    }

    showOutline() {
        switch(this.enemyType) {
            case enemyType.ZOMBIE: {
                this.spriteSheet.src = spriteSheets.zombie_outline;
                break;
            }
            case enemyType.GHOST: {
                this.spriteSheet.src = spriteSheets.ghost_outline;
                break;
            }
            case enemyType.SKELETON: {
                this.spriteSheet.src = spriteSheets.skeleton_outline;
                break;
            }
        }
    }

    collidedWithBomb() {

        // Reset collision here, since we only care about toggling it when it collides with bomb,
        // otherwise the movement logic wont fire again.
        this.collides = false;
        this.isChasingPlayer = false;

        switch(this.enemyType) {
            case enemyType.ZOMBIE: {
                this.playSfx();
                this.patrol();
                break;
            }
            case enemyType.GHOST: {
                this.roam();
                break;
            }
            case enemyType.SKELETON: {
                this.movementMode = movementMode.PATROL;
                this.patrol();
                //this.followPlayer();
                break;
            }
        }
        
    }

    getLocation() {
        return {x: this.x, y: this.y};
    }

    getRandomPath() {
        if(this.spawnedFromDoor) {
            const maxRadius = 25*tileSize;
            const minRadius = 2*tileSize;
            const targetLocation = 
            getRandomWalkablePointInRadius({x: this.x, y: this.y},
                minRadius, maxRadius);
            this.targetLocation = {x: targetLocation.x, y: targetLocation.y};
        } else {
            const path = dfs(this, maxPathLength);
            const target = {x: path[path.length-1].x, y: path[path.length-1].y};
            this.targetLocation = target;
        }
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

    stopMove() {
        clearInterval(this.timer);
        if(this.currentPath) {
            this.currentPath.length = 0;
        }
        this.isMoving = false;
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

            if(globalPause || this.collides) {
                return;
            }

            this.isMoving = true;

            this.next = this.currentPath[index];

            // Move enemy
            this.x = this.next.x;
            this.y = this.next.y;
            this.t = 0;

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

            // If the type is skeleton, and the distance to the player is 
            // less than the threshold, then start chasing the player
            if(this.enemyType == enemyType.SKELETON) {
                const distance = getDistanceToEuclidean(this.getLocation(), this.targetLocation);
                const threshold = 128;
                if(!this.isChasingPlayer) {
                    this.getPlayerLocation();
                    if(distance <= threshold) {
                        this.isChasingPlayer = true;
                        this.stopMove();
                        this.renderX = this.x;
                        this.renderY = this.y;
                        this.movementMode = movementMode.FOLLOW;
                        this.followPlayer();
                    }
                } else {
                    // If distance is greater than giveupThreshold, then give up
                    // and start patroling again
                    const giveupThreshold = 256;
                    if(distance > giveupThreshold) {
                        this.isChasingPlayer = false;
                        this.stopMove();
                        this.renderX = this.x;
                        this.renderY = this.y;
                        this.movementMode = movementMode.PATROL;
                        this.patrol();
                    }
                }
            }

            if(!this.currentPath) {
                return;
            }

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
        this.playSfx();
        const deathAnimation = new EnemyDeathAnimation(this.x, this.y, this.enemyType, this.direction);
        deathAnimation.startTimer();
        deathRow.push(deathAnimation);

        switch(this.enemyType) {
            case enemyType.ZOMBIE: {
                game.increaseScore(200);
                break;
            }
            case enemyType.GHOST: {
                game.increaseScore(350);
                break;
            }
            case enemyType.SKELETON: {
                game.increaseScore(500);
                break;
            }
        }

        let result = findEnemyById(this.id);
        // console.log("ID:", result);
        enemies.splice(result.index, 1);

        this.movementMode = movementMode.IDLE;
        this.stopMove();

        for (let prop in this) {
            this[prop] = null;
        }

        game.decreaseEnemies();
        game.checkGameState();
    }

    update(currentTime, x, y) {

        // Update collision location
        this.collisionBox = {x: x + 16, y: y, 
                             w: this.collisionW, h: this.collisionH+10};

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

    checkCollisions() {
        // Check if enemy collides with player
        players.forEach(player => {
            if (player !== undefined) {
                // Dont check if player is dead
                if(!player.isDead) {
                    if(aabbCollision(this.collisionBox, player.collisionBox)) {
                        player.onDeath(this, false);
                        this.collides = true;
                        this.playerTarget = null;
                        this.stopMove();
                    }
                }
            }
        });
        // Check if enemy collides with bomb
        tilesWithBombs.forEach(tile => {
            if(tile.bomb && tile.bomb.collisionBox && this.collisionBox) {
                if(aabbCollision(this.collisionBox, tile.bomb.collisionBox)) {
                    this.collides = true;
                    this.stopMove();
                    this.x = this.next.x;
                    this.y = this.next.y;
                    setTimeout(() => {
                        this.collidedWithBomb();
                    }, 500); // Make the enemy wait for a bit before moving away from the bomb
                }
            }
        });
    }

    playSfx() {
        let randomSound = undefined;

        switch(this.enemyType) {
            case enemyType.ZOMBIE: {
                randomSound = randomSfx(sfxs['ZOMBIES']);
                break;
            }
            case enemyType.GHOST: {
                randomSound = randomSfx(sfxs['GHOSTS']);
                break;
            }
            case enemyType.SKELETON: {
                return;
                break;
            }
        }

        playAudio(randomSound);
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
export function spawnEnemies(array)
{
    const typeValues = Object.values(enemyType);
    const amount = array.length;
    const maxRadius = 25*tileSize;
    const minRadius = 2*tileSize;

    const player = players[0];
    for (let i = 0; i < amount; i++) {
        const random = getRandomWalkablePointInRadius({x: player.x,
                                                       y: player.y},
                                                       minRadius, maxRadius);
        const enemy = new Enemy(random.x, random.y, tileSize, tileSize);
        let typeIndex = i;
        enemy.enemyType = array[i];
        enemy.init();
        enemies.push(enemy);

        if (typeIndex > typeValues.length) {
            typeIndex = 0;
        }
    }

    game.numOfEnemies = enemies.length;
}

// Spawn enemy with given type in random location
export function spawnEnemiesByType(type, amount)
{
    const maxRadius = 25*tileSize;
    const minRadius = 2*tileSize;

    const player = players[0];
    for (let i = 0; i < amount; i++) {
        const random = getRandomWalkablePointInRadius({x: player.x,
                                                       y: player.y},
                                                       minRadius, maxRadius);
        const enemy = new Enemy(random.x, random.y, tileSize, tileSize);
        enemy.enemyType = type;
        enemy.init();
        enemies.push(enemy);
    }

    game.numOfEnemies = enemies.length;
}

// Spawn enemies at location
export function spawnEnemiesAtLocation(location, amount = 1)
{
    for (let i = 0; i < amount; i++) {
        const enemy = new Enemy(location.x, location.y, tileSize, tileSize);
        enemy.speed = getRandomSpeed();
        enemy.spawnedFromDoor = true;
        enemy.init();
        enemies.push(enemy);
        game.increaseEnemies();
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

            let x = enemy.x;
            let y = enemy.y;

            if(!enemy.collides) {
                // Smooth rendering
                enemy.t += deltaTime * (1 / (enemy.speed / 1000));
                enemy.t = Math.min(enemy.t, 1); // NEED TO CLAMP THIS ONE TOO!

                x = lerp(enemy.x, enemy.renderX, enemy.t);
                y = lerp(enemy.y, enemy.renderY, enemy.t);
            } else {
                enemy.renderX = enemy.x;
                enemy.renderY = enemy.y;
            }

            enemy.update(timeStamp, x, y);
            enemy.checkCollisions();
        }
    });
}

export function clearEnemies() {
    enemies.forEach(enemy => {
        enemy.movementMode = movementMode.IDLE;
        enemy.stopMove();
        for (let prop in enemy)
            enemy[prop] = null;
    });
    enemies.length = 0;
}
