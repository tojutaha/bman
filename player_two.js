import { canvas, ctx, level, levelHeight, levelWidth, tileSize, spriteSheet } from "../main.js";
import { dropBomb_p2 } from "../bomb.js";
import { pickPowerup } from "../powerup.js";
import { isDeadly, isWalkable, hasPowerup } from "../utils.js";


// TODO: Tiedosto on vaan kopio p1 siinä kunnossa kun se oli 22/09/2023 klo 16.00.
//          Tästä on aikalailla vaan muutettu napit ja kaikki mikä oli player on nyt playerTwo


// Tämän kun heittää trueksi, saa sen ensimmäisen version
// liikkumisen takaisin.
const useGridMovement = false;

const gridMovementSpeed = 125; // interval / ms
let initialMove = true;

export let smoothMovementSpeed = 1.0; // pixels/s

export function setMovementSpeed(value) {
    smoothMovementSpeed = value;
}

export const playerTwo = {
    x: 736, // start from bottom right corner
    y: 736,
    w: 30,
    h: 30,
    dx: 0,
    dy: 0,
};

export const Direction = {
    UP: "Up",
    DOWN: "Down",
    LEFT: "Left",
    RIGHT: "Right",
}

// TODO: Tätä ei välttämättä tarvii enää exporttina (deklaraatio takaisin smoothMovementUpdateplayerTwoiin)
// No pixel-perfect collisions pls
export const playerTwoOffset = 5;

////////////////////
// Render/Update
let movementTimer = null;

function startMovement(direction)
{
    if (movementTimer === null) {
        movementTimer = setInterval(() => {
            moveplayerTwo(direction);
        }, gridMovementSpeed);
    }
}

function stopMovement()
{
    initialMove = true;
    clearInterval(movementTimer);
    movementTimer = null;
}

function moveplayerTwo(direction)
{
    switch(direction) {
        case Direction.UP:
            playerTwo.dy = -1;
            playerTwo.dx = 0;
            break;
        case Direction.DOWN:
            playerTwo.dy = 1;
            playerTwo.dx = 0;
            break;
        case Direction.LEFT:
            playerTwo.dx = -1;
            playerTwo.dy = 0;
            break;
        case Direction.RIGHT:
            playerTwo.dx = 1;
            playerTwo.dy = 0;
            break;
    }

}

function gridMovementUpdateplayerTwo()
{
    let nextX = Math.floor((playerTwo.x + playerTwo.w / 2) / tileSize);
    let nextY = Math.floor((playerTwo.y + playerTwo.h / 2) / tileSize);

    nextX += playerTwo.dx;
    nextY += playerTwo.dy;

    if (isWalkable(nextX, nextY)) {
        playerTwo.x = nextX * tileSize;
        playerTwo.y = nextY * tileSize;
        playerTwo.dx = 0;
        playerTwo.dy = 0;
    }
}

function smoothMovementUpdateplayerTwo()
{
    const nextX = playerTwo.x + playerTwo.dx;
    const nextY = playerTwo.y + playerTwo.dy;

    let collides = false;
    for (let y = 0; y < levelHeight; y++) {
        for (let x = 0; x < levelWidth; x++) {
            const tileLeft   = level[x][y].x;
            const tileRight  = level[x][y].x + tileSize;
            const tileTop    = level[x][y].y;
            const tileBottom = level[x][y].y + tileSize;


            if (!isWalkable(x, y) &&
                nextX + (playerTwo.w - playerTwoOffset) >= tileLeft &&
                (nextX + playerTwoOffset) < tileRight &&
                nextY + (playerTwo.h - playerTwoOffset) >= tileTop &&
                (nextY + playerTwoOffset) < tileBottom
            ) {

                collides = true;
            }

            if (isDeadly(x, y) &&
                nextX + (playerTwo.w - playerTwoOffset) >= tileLeft &&
                (nextX + playerTwoOffset) < tileRight &&
                nextY + (playerTwo.h - playerTwoOffset) >= tileTop &&
                (nextY + playerTwoOffset) < tileBottom
            ) {
                console.info("DEATH BY TILE");
            }

            // No picking up from just touching the walls
            const pickupOffset = 3;
            if (hasPowerup(x, y) &&
                nextX + (playerTwo.w - playerTwoOffset - pickupOffset) >= tileLeft &&
                (nextX + playerTwoOffset + pickupOffset) < tileRight &&
                nextY + (playerTwo.h - playerTwoOffset - pickupOffset) >= tileTop &&
                (nextY + playerTwoOffset + pickupOffset) < tileBottom
            ) {
                pickPowerup(level[x][y]);
            }
        }
    }

    //console.log(collides);
    if (!collides) {
        playerTwo.x += playerTwo.dx;
        playerTwo.y += playerTwo.dy;
    }
}

const updateplayerTwo = useGridMovement ? gridMovementUpdateplayerTwo : smoothMovementUpdateplayerTwo;
export function renderPlayerTwo()
{
    updateplayerTwo();
    
    // Alkuperäinen palikka
    // ctx.fillStyle = "#ff0000";
    // ctx.fillRect(playerTwo.x, playerTwo.y, playerTwo.w, playerTwo.h);

    ctx.drawImage(spriteSheet, 0, 96, 32, 32, playerTwo.x, playerTwo.y, playerTwo.w, playerTwo.h);
}

////////////////////
// Inputs
function gridMovementHandleKeyDown(event)
{
    event.preventDefault();

    const move = initialMove ? moveplayerTwo : startMovement;
    switch(event.key) {
        case "i":
            //startMovement(Direction.UP);
            move(Direction.UP);
            initialMove = false;
            break;

        case "j":
            //startMovement(Direction.LEFT);
            move(Direction.LEFT);
            initialMove = false;
            break;

        case "k":
            //startMovement(Direction.DOWN);
            move(Direction.DOWN);
            initialMove = false;
            break;

        case "l":
            //startMovement(Direction.RIGHT);
            move(Direction.RIGHT);
            initialMove = false;
            break;

        case "f":
            dropBomb_p2();
            console.log("dropped")
            break;
    }
}

function smoothMovementHandleKeyDown(event)
{
    event.preventDefault();

    switch(event.key) {
        case "i":
            playerTwo.dy = -smoothMovementSpeed;
            playerTwo.dx = 0;
            break;

        case "j":
            playerTwo.dx = -smoothMovementSpeed;
            playerTwo.dy = 0;
            break;

        case "k":
            playerTwo.dy = smoothMovementSpeed;
            playerTwo.dx = 0;
            break;

        case "l":
            playerTwo.dx = smoothMovementSpeed;
            playerTwo.dy = 0;
            break;

        case "f":
            dropBomb_p2();
            console.log("dropped")
            break;
    }
}

function gridMovementHandleKeyUp(event)
{
    event.preventDefault();

    switch(event.key) {
        case "i":
        case "k":
        case "j":
        case "l":
            stopMovement();
            break;
    }
}

function smoothMovementHandleKeyUp(event)
{
    event.preventDefault();

    switch(event.key) {
        case "i":
        case "k":
            playerTwo.dy = 0;
            break;

        case "j":
        case "l":
            playerTwo.dx = 0;
            break;
    }
}

////////////////////
// DOM
const handleKeyDown = useGridMovement ? gridMovementHandleKeyDown : smoothMovementHandleKeyDown;
const handleKeyUp = useGridMovement ? gridMovementHandleKeyUp : smoothMovementHandleKeyUp;
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

