import { canvas, ctx, level, levelHeight, levelWidth, tileSize, spriteSheet } from "./main.js";

export function isWalkable(x, y)
{
    if (x < 0 || x >= levelWidth ||
        y < 0 || y >= levelHeight) {
        return false;
    }

    return level[x][y].isWalkable;
}

