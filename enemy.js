import { canvas, ctx, deltaTime, game, level, levelHeight, levelWidth, tileSize } from "./main.js";
import { Direction, players } from "./player.js";
import { lerp, getDistanceTo, getRandomWalkablePointInRadius, getTileFromWorldLocation, isWalkable } from "./utils.js";
import { requestPath, drawPath } from "./pathfinder.js";
import { tilesWithBombs } from "./bomb.js";
import { PlayAudio } from "./audio.js";


export const movementMode = {
    IDLE: "Idle",
    ROAM: "Roam",
    PATROL: "Patrol",
    FOLLOW: "Follow",
}

class Enemy
{
    static lastId = 0;

    constructor(x, y, w, h, newMovementMode, speed) {
        this.id = ++Enemy.lastId;

        // Coordinates
        this.x  = x;
        this.y  = y;

        // Size
        this.w  = w;
        this.h  = h;

        // Movement
        this.dx = 0;
        this.dy = 0;
        this.useDiagonalMovement = false;
        this.movementMode = newMovementMode || movementMode.ROAM;
        this.speed = speed || 500;
        this.direction = Direction.UP;
        this.timer = null;

        // Behaviour
        this.currentPath = [];
        this.startLocation = {x: this.x, y: this.y};
        this.targetLocation = {x: 0, y: 0};
        this.playerTarget = null;

        // Rendering
        this.renderX = this.x;
        this.renderY = this.y;
        this.t = 0;

        // Debug
        this.color = "#ff00ff";
        this.pathColor = "yellow";
    }

    setDebugColors() {
        switch(this.movementMode) {
            case movementMode.IDLE:
                this.color = "#00ff00";
                this.pathColor = "#00ff00";
                break;
            case movementMode.ROAM:
                this.color = "#ff00ff";
                this.pathColor = "#ff00ff";
                break;
            case movementMode.PATROL:
                this.color = "#00ffff";
                this.pathColor = "#00ffff";
                break;
            case movementMode.FOLLOW:
                this.color = "#ff0000";
                this.pathColor = "#ff0000";
                break;
        }
    }

    getLocation() {
        return {x: this.x, y: this.y};
    }

    setMovementMode(newMovementMode) {
        this.movementMode = newMovementMode;
    }

    init() {
        switch(this.movementMode) {
            case movementMode.IDLE:
                // Nothing to do
                break;
            case movementMode.ROAM:
                // Randomly roam around map
                this.roam();
                break;
            case movementMode.PATROL:
                // Patrol between two points
                this.patrol();
                break;
            case movementMode.FOLLOW:
                // Follow player
                this.followPlayer();
                break;
        }

        this.justSpawned = true;
        this.spawnImmortality = setTimeout(() => {
            this.justSpawned = false;
        }, 2000);
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
            
            // Store movement direction
            if (next.x < this.x) {
                this.direction = Direction.LEFT;
            } else if (next.x > this.x) {
                this.direction = Direction.RIGHT;
            }

            if (next.y < this.y) {
                this.direction = Direction.UP;
            } else if (next.y > this.y) {
                this.direction = Direction.DOWN;
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
                    // TODO: Varmaan stopataan myöhemmin, kun 
                    // ei ole pelaajia jäljellä?
                    //clearInterval(this.timer);
                }
            });

            // Smoother movement for rendering
            if (renderIndex < this.currentPath.length) {
                const renderLoc = this.currentPath[renderIndex]
                this.renderX = renderLoc.x;
                this.renderY = renderLoc.y;
                renderIndex++;
            }
            index++;


            //console.log("real location :", this.x, this.y);
            //console.log("render location :", this.renderX, this.renderY);

            if (index >= this.currentPath.length) {

                clearInterval(this.timer);
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
};

function getRandomColor()
{

    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
}

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
    const movementValues = Object.values(movementMode);
    //const amount = movementValues.length;
    const amount = 1;
    const maxRadius = 25*tileSize;
    const minRadius = 10*tileSize;

    // TODO: Muut pelaajat?
    const player = players[0];
    for (let i = 0; i < amount; i++) {
        const random = getRandomWalkablePointInRadius({x: player.x,
                                                       y: player.y},
                                                       minRadius, maxRadius);
        const enemy = new Enemy(random.x, random.y, tileSize, tileSize);
        let colIndex = i;
        //enemy.setMovementMode(movementValues[colIndex]);
        enemy.setMovementMode(movementMode.IDLE);
        enemy.speed = getRandomSpeed();
        enemy.setDebugColors();
        enemy.init();
        enemies.push(enemy);
        game.increaseEnemies();

        if (colIndex > movementValues.length) {
            colIndex = 0;
        }
    }
}

// Spawn enemies at location
export function spawnEnemiesAtLocation(location, amount = 1)
{
    for (let i = 0; i < amount; i++) {
        const enemy = new Enemy(location.x, location.y, tileSize, tileSize);
        enemy.setMovementMode(movementMode.ROAM);
        enemy.speed = getRandomSpeed();
        enemy.color = getRandomColor();
        enemy.pathColor = enemy.color;
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

export function renderEnemies()
{
    if (isNaN(deltaTime)) {
        return;
    }

    enemies.forEach(enemy => {
        if (enemy) {
            //ctx.fillStyle = "#00ff00";
            //ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);

            enemy.t += deltaTime * (1 / (enemy.speed / 1000));
            enemy.t = Math.min(enemy.t, 1); // NEED TO CLAMP THIS ONE TOO!

            const x = lerp(enemy.x, enemy.renderX, enemy.t);
            const y = lerp(enemy.y, enemy.renderY, enemy.t);

            ctx.fillStyle = enemy.color;
            ctx.fillRect(x, y, enemy.w, enemy.h);
        }
    });

    //
    drawPath();
    //
}

// Example usages:
if (0) {
    setTimeout(() => {
    //spawnEnemiesAtLocation({x: 32, y: 32}, 5); // Spawn 5 enemies on location 32, 32
    let result = findEnemyById(1); // Find enemy that has id 1
    enemies.splice(result.index, 1); // Deletes the enemy
    }, 1000);
}

// Load enemies
export function loadEnemies(loadedEnemies) {
    enemies = loadedEnemies;
}
