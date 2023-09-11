const TileType = {
    FLOOR: "Floor",
    NON_DESTRUCTIBLE_WALL: "NonDestructibleWall",
    DESTRUCTIBLE_WALL: "DestructibleWall",
};

function Tile(x, y, isWalkable, type) {
    this.x = x || 0,
    this.y = y || 0,
    this.isWalkable = isWalkable || false,
    this.type = type || TileType.FLOOR
    // tekstuurit jne vois laitella myös tänne.
};

