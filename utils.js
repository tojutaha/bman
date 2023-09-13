import { canvas, ctx, level, levelHeight, levelWidth, tileSize, spriteSheet } from "./main.js";

// 2d vektori
export const v2 = {
    x: 0,
    y: 0,

    addV2: function(other) {
        this.x += other.x;
        this.y += other.y;
    },

    addS: function(scalar) {
        this.x += scalar;
        this.y += scalar;
    },

    subtractV2: function(other) {
        this.x -= other.x;
        this.y -= other.y;
    },

    subtractS: function(scalar) {
        this.x -= scalar;
        this.y -= scalar;
    },

    multiplyV2: function(other) {
        this.x *= other.x;
        this.y *= other.y;
    },

    multiplyS: function(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    },

    isEqual: function(other) {
        return this.x === other.x &&
               this.y === other.y;
    },

    dist: function(other) {
        let dx = other.x - this.x;
        let dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

export function isWalkable(x, y)
{
    if (x < 0 || x >= levelWidth ||
        y < 0 || y >= levelHeight) {
        return false;
    }

    return level[x][y].isWalkable;
}

