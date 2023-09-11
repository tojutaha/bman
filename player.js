import { canvas, ctx, level, levelHeight, levelWidth, playerSize, tileSize } from "./main.js";

// Tämän kun heittää falseksi, saa sen ensimmäisen version
// liikkumisen takaisin.
const useGridMovement = true;
const gridMovementSpeed = 125; // interval / ms
const smoothMovementSpeed = 2; // pixels/s

const player = {
    x: 32, // start from top left corner
    y: 32,
    w: 32,
    h: 32,
    dx: 0,
    dy: 0,
};

const Direction = {
    UP: "Up",
    DOWN: "Down",
    LEFT: "Left",
    RIGHT: "Right",
}

////////////////////
// Render/Update
let movementTimer = null;

function startMovement(direction)
{
    if (movementTimer === null) {
        movementTimer = setInterval(() => {
            movePlayer(direction);
        }, gridMovementSpeed);
    }
}

function stopMovement()
{
    clearInterval(movementTimer);
    movementTimer = null;
}

function movePlayer(direction)
{
    switch(direction) {
        case Direction.UP:
            player.dy = -1;
            player.dx = 0;
            break;
        case Direction.DOWN:
            player.dy = 1;
            player.dx = 0;
            break;
        case Direction.LEFT:
            player.dx = -1;
            player.dy = 0;
            break;
        case Direction.RIGHT:
            player.dx = 1;
            player.dy = 0;
            break;
    }

}

function isWalkable(x, y)
{
    if (x < 0 || x >= levelWidth ||
        y < 0 || y >= levelHeight) {
        return false;
    }

    return level[x][y].isWalkable;
}

function gridMovementUpdatePlayer()
{
    let nextX = Math.floor((player.x + player.w / 2) / tileSize);
    let nextY = Math.floor((player.y + player.h / 2) / tileSize);

    nextX += player.dx;
    nextY += player.dy;

    if (isWalkable(nextX, nextY)) {
        player.x = nextX * tileSize;
        player.y = nextY * tileSize;
        player.dx = 0;
        player.dy = 0;
    }
}

function smoothMovementUpdatePlayer()
{
    // Left
    if (player.x <= tileSize) {
        player.x = tileSize;
    }

    // Right
    if (player.x >= (levelWidth - 2) * tileSize) {
        player.x = (levelWidth - 2) * tileSize;
    }

    // Top
    if (player.y <= tileSize) {
        player.y = tileSize;
    }

    // Bottom
    if (player.y >= (levelHeight - 2) * tileSize) {
        player.y = (levelHeight - 2) *tileSize;
    }

    // TODO: loput collision testit...

    player.x += player.dx;
    player.y += player.dy;
}

const updatePlayer = useGridMovement ? gridMovementUpdatePlayer : smoothMovementUpdatePlayer;
export function renderPlayer()
{
    updatePlayer();

    ctx.fillStyle = "#ff0000";
    ctx.fillRect(player.x, player.y, playerSize, playerSize);
}

////////////////////
// Inputs
function gridMovementHandleKeyDown(event)
{
    event.preventDefault();

    switch(event.key) {
        case "w":
            startMovement(Direction.UP);
            break;

        case "a":
            startMovement(Direction.LEFT);
            break;

        case "s":
            startMovement(Direction.DOWN);
            break;

        case "d":
            startMovement(Direction.RIGHT);
            break;

        case " ":
            console.log("laitappa pommi");
            break;
    }
}

function smoothMovementHandleKeyDown(event)
{
    event.preventDefault();

    switch(event.key) {
        case "w":
            player.dy = -smoothMovementSpeed;
            break;

        case "a":
            player.dx = -smoothMovementSpeed;
            break;

        case "s":
            player.dy = smoothMovementSpeed;
            break;

        case "d":
            player.dx = smoothMovementSpeed;
            break;

        case " ":
            console.log("laitappa pommi");
            break;
    }
}

function gridMovementHandleKeyUp(event)
{
    event.preventDefault();

    switch(event.key) {
        case "w":
        case "s":
        case "a":
        case "d":
            stopMovement();
            break;
    }
}

function smoothMovementHandleKeyUp(event)
{
    event.preventDefault();

    switch(event.key) {
        case "w":
        case "s":
            player.dy = 0;
            break;

        case "a":
        case "d":
            player.dx = 0;
            break;
    }
}

////////////////////
// DOM
const handleKeyDown = useGridMovement ? gridMovementHandleKeyDown : smoothMovementHandleKeyDown;
const handleKeyUp = useGridMovement ? gridMovementHandleKeyUp : smoothMovementHandleKeyUp;
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

