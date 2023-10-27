import { canvas, ctx, deltaTime, game, globalPause, level, tileSize } from "./main.js";
import { levelHeight, levelWidth } from "./gamestate.js";
import { Direction, players } from "./player.js";
import { lerp, getDistanceTo, getRandomWalkablePointInRadius, getTileFromWorldLocation, isWalkable, getDistanceToEuclidean, aabbCollision } from "./utils.js";
import { requestPath } from "./pathfinder.js";
import { tilesWithBombs } from "./bomb.js";
import { PlayAudio } from "./audio.js";

// Audio
const zombieSfx = ["assets/sfx/zombie01.mp3", "assets/sfx/zombie02.mp3", "assets/sfx/zombie03.mp3", "assets/sfx/zombie04.mp3", "assets/sfx/zombie05.mp3"];
const ghostSfx = ["assets/sfx/ghost01.mp3", "assets/sfx/ghost02.mp3", "assets/sfx/ghost03.mp3", "assets/sfx/ghost04.mp3", "assets/sfx/ghost05.mp3"];

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

    }

    init() {

        switch(this.enemyType) {
            case enemyType.ZOMBIE: {
                this.totalFrames = 4;
                this.frameWidth = 256/4;
                this.spriteSheet.src = "./assets/placeholder_zombi.png";
                this.movementMode = movementMode.PATROL;
                this.speed = 800;
                this.patrol();
                break;
            }
            case enemyType.GHOST: {
                this.spriteSheet.src = "./assets/ghost_01.png";
                this.movementMode = movementMode.ROAM;
                this.speed = 500;
                this.roam();
                break;
            }
            case enemyType.SKELETON: {
                this.spriteSheet.src = "./assets/skeleton_01.png";
                this.movementMode = movementMode.FOLLOW;
                this.speed = 400;
                this.followPlayer();
                break;
            }
        }
        
        if (this.justSpawned) {
            this.spawnImmortality = setTimeout(() => {
                this.justSpawned = false;
            }, 2000);
        }
    }

    collidedWithBomb() {
        this.playSfx();

        switch(this.enemyType) {
            case enemyType.ZOMBIE: {
                this.patrol();
                break;
            }
            case enemyType.GHOST: {
                this.roam();
                break;
            }
            case enemyType.SKELETON: {
                this.followPlayer();
                break;
            }
        }
        
    }

    getLocation() {
        return {x: this.x, y: this.y};
    }

    getRandomPath() {
        const maxRadius = 25*tileSize;
        const minRadius = 2*tileSize;
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

            if(globalPause || this.collides) {
                return;
            }

            this.isMoving = true;

            this.next = this.currentPath[index];

            // NOTE: Pidetään tämäkin vielä tuo checkCollisionin lisäksi,
            // niin animaatiot ei glitchaa joissain tapauksissa.
            // Check if there is a bomb on the path
            const nextInRender = this.currentPath[renderIndex]
            if (nextInRender !== undefined) {
                const bombInNext    = tilesWithBombs.find(bomb => bomb.x === nextInRender.x && bomb.y === nextInRender.y);
                const bombInCurrent = tilesWithBombs.find(bomb => bomb.x === this.x && bomb.y === this.y);
                if (bombInNext || bombInCurrent) {
                    this.x = this.next.x;
                    this.y = this.next.y;
                    clearInterval(this.timer);
                    this.currentPath.length = 0;
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
        this.playSfx();

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
        // console.log("ID:", result);
        enemies.splice(result.index, 1);

        this.movementMode = movementMode.IDLE;
        clearInterval(this.timer);

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
        /*
        // Draw enemy collision box
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(this.collisionBox.x, this.collisionBox.y, 
                     this.collisionBox.w, this.collisionBox.h);
        */
        // Check if enemy collides with player
        players.forEach(player => {
            if (player !== undefined) {
                /*
                // Draw player collsion box
                ctx.fillStyle = "#00ff00";
                ctx.fillRect(player.collisionBox.x, player.collisionBox.y, 
                             player.collisionBox.w, player.collisionBox.h);
                */
                // Dont check if player is dead
                if(!player.isDead) {
                    if(aabbCollision(this.collisionBox, player.collisionBox)) {
                        player.onDeath();
                        this.collides = true;
                        this.playerTarget = null;
                        clearInterval(this.timer);
                        this.isMoving = false;
                    }
                }
            }
        });
        // Check if enemy collides with bomb
        tilesWithBombs.forEach(tile => {
            if(tile.bomb && tile.bomb.collisionBox && this.collisionBox) {
                // Draw bomb collision box
                //ctx.fillStyle = "#0000ff";
                //ctx.fillRect(tile.bomb.collisionBox.x, tile.bomb.collisionBox.y, 
                             //tile.bomb.collisionBox.w, tile.bomb.collisionBox.h);
                if(aabbCollision(this.collisionBox, tile.bomb.collisionBox)) {
                    this.collides = true;
                    clearInterval(this.timer);
                    this.currentPath.length = 0;
                    this.isMoving = false;
                    this.x = this.next.x;
                    this.y = this.next.y;
                    setTimeout(() => {
                        this.collidedWithBomb();
                    }, 1000);
                }
            }
        });
    }

    playSfx() {
        let randomSound = undefined;

        switch(this.enemyType) {
            case enemyType.ZOMBIE: {
                randomSound = zombieSfx[Math.floor(Math.random() * zombieSfx.length)];
                break;
            }
            case enemyType.GHOST: {
                randomSound = ghostSfx[Math.floor(Math.random() * ghostSfx.length)];
                break;
            }
            case enemyType.SKELETON: {
                return;
                break;
            }
        }

        PlayAudio(randomSound);
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

// Spawn enemies at location
export function spawnEnemiesAtLocation(location, amount = 1)
{
    for (let i = 0; i < amount; i++) {
        const enemy = new Enemy(location.x, location.y, tileSize, tileSize);
        enemy.speed = getRandomSpeed();
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
        clearInterval(enemy.timer);
        for (let prop in enemy)
            enemy[prop] = null;
    });
    enemies.length = 0;
}

