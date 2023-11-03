async function preLoadSpriteSheets() {
    const spritesheets = {
        player_normal: "./assets/player0.png",
        player_lantern: "./assets/player0_lantern.png",

        zombie: "./assets/placeholder_zombi.png",
        ghost: "./assets/ghost_03.png",
        skeleton: "./assets/skeleton_02.png",

        zombie_outline: "./assets/zombi_outline.png",
        ghost_outline: "./assets/ghost_outline.png",
        skeleton_outline: "./assets/skeleton_outline.png",

        zombie_death_back:  "./assets/zombi_death_back.png",
        zombie_death_front: "./assets/zombi_death_front.png",
        zombie_death_left:  "./assets/zombi_death_left.png",
        zombie_death_right: "./assets/zombi_death_right.png",

        ghost_death: "./assets/ghost_death.png",

        skeleton_death_back:  "./assets/skeleton_death_back.png",
        skeleton_death_front: "./assets/skeleton_death_front.png",
        skeleton_death_left:  "./assets/skeleton_death_left.png",
        skeleton_death_right: "./assets/skeleton_death_right.png",

        bomb: "./assets/bomb.png",
        explosion: "./assets/explosion.png",
        stone_brick_alt: "./assets/stone_brick_03_alt.png",

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
