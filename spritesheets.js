async function preLoadSpriteSheets() {
    const spritesheets = {
        player1_normal: "./assets/players/player_shadows.png",
        player1_lantern: "./assets/players/player_lantern_shadows.png",

        player2_normal: "./assets/players/player2_shadows.png",
        player2_lantern: "./assets/players/player2_lantern_shadows.png",

        zombie: "./assets/enemies/zombie_shadows.png",
        ghost: "./assets/ghost.png",
        skeleton: "./assets/skeleton2.png",

        zombie_outline: "./assets/enemies/zombie_outline.png",

        zombie_death_back:  "./assets/deaths/zombie_death_back.png",
        zombie_death_front: "./assets/deaths/zombie_death_front.png",
        zombie_death_left:  "./assets/deaths/zombie_death_left.png",
        zombie_death_right: "./assets/deaths/zombie_death_right.png",

        ghost_death: "./assets/deaths/ghost_death.png",

        skeleton_death_back:  "./assets/deaths/skeleton_death_back.png",
        skeleton_death_front: "./assets/deaths/skeleton_death_front.png",
        skeleton_death_left:  "./assets/deaths/skeleton_death_left.png",
        skeleton_death_right: "./assets/deaths/skeleton_death_right.png",

        bomb: "./assets/bomb.png",
        explosion: "./assets/explosion.png",
        wall_animation: "./assets/wall_animation.png",
        powerups: "./assets/powerups.png",
        door: "./assets/door_animation_night.png",

        tutorial_keys: "./assets/tutorial_keys_animation.png",
        big_bomb_overlay: "./assets/big_bomb_overlay.png",
    };

    let promises = [];
    for(let sheet in spritesheets) {
        promises.push(new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = spritesheets[sheet];
        }));
    }

    return Promise.all(promises).then(() => spritesheets);
}

export let spriteSheets = []
export async function loadSpriteSheets() {
    try {
    spriteSheets = await preLoadSpriteSheets();
    } catch(error) {
        console.error(`Error loading textures: ${error}`);
    }
}
