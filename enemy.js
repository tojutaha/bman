import { bigBombOverlay, ctx, fixedDeltaTime, game, globalPause, isMultiplayer, tileSize } from "./main.js";
import { Direction, players } from "./player.js";
import { dfs, lerp, getRandomWalkablePointInRadius, getTileFromWorldLocation, aabbCollision, getDistanceToEuclidean } from "./utils.js";
import { requestPath } from "./pathfinder.js";
import { tilesWithBombs } from "./bomb.js";
import { getMusicalTimeout, playAudio, randomSfx, sfxs } from "./audio.js";
import { EnemyDeathAnimation, deathRow } from "./animations.js";
import { spriteSheets } from "./spritesheets.js";
import { createFloatingText } from "./particles.js";
import { initPickups } from "./pickups.js";

export const enemyType = {
    ZOMBIE: "zombie",
    GHOST: "ghost",
    SKELETON: "skeleton",
    WITCH: "witch",
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
        this.spawnImmortalityTime = isMultiplayer ? 0 : 2000;
        this.score = 0;

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
        this.patrollingCount = 0;

        // Rendering
        this.renderX = this.x;
        this.renderY = this.y;
        this.t = 0;

        // Animations
        this.spriteSheet = new Image();
        this.frameWidth = 256/4;
        this.frameHeight = 288/4;
        this.totalFrames = 4;
        this.currentFrame = 0;
        this.animationSpeed = 150;
        this.lastTime = 0;

        // Should only be true for enemies that spawn from door!
        this.spawnedFromDoor = false;
    }

    init() {

        switch(this.enemyType) {
            case enemyType.ZOMBIE: {
                this.spriteSheet.src = spriteSheets.zombie;
                this.movementMode = movementMode.PATROL;
                this.speed = 1000;
                this.score = 100;
                this.patrol();
                break;
            }
            case enemyType.GHOST: {
                this.spriteSheet.src = spriteSheets.ghost;
                this.movementMode = movementMode.ROAM;
                this.animationSpeed = 400;
                this.speed = 600;
                this.score = 250;
                this.roam();
                break;
            }
            case enemyType.SKELETON: {
                this.spriteSheet.src = spriteSheets.skeleton;
                this.movementMode = movementMode.PATROL;
                this.speed = 400;
                this.score = 500;
                this.patrol();
                break;
            }
            case enemyType.WITCH: {
                this.spriteSheet.src = spriteSheets.witch;
                this.movementMode = movementMode.FOLLOW;
                this.speed = 900;
                this.score = 350;
                this.followPlayer();
                if (!isMultiplayer) {
                    this.initWitch();
                }
                break;
            }
        }
        
        if (this.justSpawned) {
            setTimeout(() => {
                this.justSpawned = false;
            }, this.spawnImmortalityTime);
        }
    }

    showSprite() {
        switch(this.enemyType) {
            case enemyType.ZOMBIE: {
                this.spriteSheet.src = spriteSheets.zombie;
                break;
            }
        }
        switch(this.enemyType) {
            case enemyType.GHOST: {
                this.spriteSheet.src = spriteSheets.ghost;
                break;
            }
        }
        switch(this.enemyType) {
            case enemyType.SKELETON: {
                this.spriteSheet.src = spriteSheets.skeleton;
                break;
            }
        }
        switch(this.enemyType) {
            case enemyType.WITCH: {
                this.spriteSheet.src = spriteSheets.witch;
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
        }
        switch(this.enemyType) {
            case enemyType.GHOST: {
                this.spriteSheet.src = spriteSheets.ghost_outline;
                break;
            }
        }
        switch(this.enemyType) {
            case enemyType.SKELETON: {
                this.spriteSheet.src = spriteSheets.skeleton_outline;
                break;
            }
        }
        switch(this.enemyType) {
            case enemyType.WITCH: {
                this.spriteSheet.src = spriteSheets.witch_outline;
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
                this.playSfx(true);
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
            this.patrollingCount = 0;
        }
        this.isMoving = false;
    }

    startMove() {
        this.timer = null;

        if (!this.currentPath) {
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

            // Check if theres player build walls along the path
            if(renderIndex < this.currentPath.length)
            {
                const nextPlusOne = this.currentPath[renderIndex];
                let tile = getTileFromWorldLocation(nextPlusOne);
                if (!tile.isWalkable) {
                    this.stopMove();
                }
            }

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
        }
        // After patrolling 5 times same route, request new path to avoid
        // getting stuck inside small areas.
        else if (this.patrollingCount >= 5) {
            this.patrollingCount = 0;
            this.currentPath.length = 0;
            this.getRandomPath();
            requestPath(this, this.getLocation(), this.targetLocation);
        } else {
            const temp = this.startLocation;
            this.startLocation = this.targetLocation;
            this.targetLocation = temp;
            this.currentPath.reverse();
            this.startMove();
            this.patrollingCount++;
        }
    }

    followPlayer() {
        this.getPlayerLocation();
        requestPath(this, this.getLocation(), this.targetLocation);
    }

    dropMushroom() {
        const tile = getTileFromWorldLocation(this);
        if (!tile.hasMushroom) {
            tile.hasMushroom = true;
            initPickups();
        }
    }

    initWitch() {
        this.dropMushroom();
        
        if (!this.mushroomInterval) {
            this.mushroomInterval = setInterval(() => {
                this.dropMushroom();
            }, 13000);
        }
    }

    die(playerID) {
        this.playSfx();
        const deathAnimation = new EnemyDeathAnimation(this.x, this.y, this.enemyType, this.direction);
        deathAnimation.startTimer();
        deathRow.push(deathAnimation);

        if(!isMultiplayer)
        {
            game.increaseScore(this.score);
        } else {
            game.increaseScore(playerID, this.score);
        }
        createFloatingText({x: this.x, y: this.y}, `+${this.score}`);

        let result = findEnemyById(this.id);
        enemies.splice(result.index, 1);

        this.movementMode = movementMode.IDLE;
        this.stopMove();

        for (let prop in this) {
                if (prop === 'mushroomInterval') {
                    clearInterval(this[prop]);
                }
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

    playSfx(withTimeout) {
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
            }
        }
        
        if (withTimeout) {
            let delay = getMusicalTimeout();
            setTimeout(() => {
                playAudio(randomSound);
            }, delay);
        } else {
            playAudio(randomSound);
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

// Spawn enemy with given type in given location
export function spawnEnemyByTypeAtLocation(type, location)
{
    const enemy = new Enemy(location.x, location.y, tileSize, tileSize);
    enemy.enemyType = type;
    enemy.init();
    enemies.push(enemy);

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
                // const updateInterval = isMobile ? 500 : 1000;
                const updateInterval = 1000;
                enemy.t += fixedDeltaTime * (1 / (enemy.speed / updateInterval));
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
        for (let prop in enemy) {
            if (prop === 'mushroomInterval') {
                clearInterval(enemy[prop]);
            }
            enemy[prop] = null;
        }
    });
    enemies.length = 0;
}
