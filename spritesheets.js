async function preLoadSpriteSheets() {
    const spritesheets = {
        player1_normal: "./assets/players/player.png",
        player1_lantern: "./assets/players/player_lantern.png",
        player1_mushroom_effect: "./assets/players/player_lantern_mushroomeffect.png",
        player1_godmode: "./assets/players/player_godmode.png",
        player1_lantern_godmode: "./assets/players/player_lantern_godmode.png",

        player2_normal: "./assets/players/player2.png",
        player2_lantern: "./assets/players/player2_lantern.png",

        zombie: "./assets/enemies/zombie.png",
        ghost: "./assets/enemies/ghost.png",
        skeleton: "./assets/enemies/skeleton.png",
        witch: "./assets/enemies/witch.png",

        zombie_outline: "./assets/enemies/zombie_outline.png",
        ghost_outline: "./assets/enemies/ghost_outline.png",
        skeleton_outline: "./assets/enemies/skeleton_outline.png",
        witch_outline: "./assets/enemies/witch_outline.png",

        zombie_death_back:  "./assets/deaths/zombie_death_back.png",
        zombie_death_front: "./assets/deaths/zombie_death_front.png",
        zombie_death_left:  "./assets/deaths/zombie_death_left.png",
        zombie_death_right: "./assets/deaths/zombie_death_right.png",

        ghost_death: "./assets/deaths/ghost_death2.png",

        skeleton_death_back:  "./assets/deaths/skeleton_death_back.png",
        skeleton_death_front: "./assets/deaths/skeleton_death_front.png",
        skeleton_death_left:  "./assets/deaths/skeleton_death_left.png",
        skeleton_death_right: "./assets/deaths/skeleton_death_right.png",

        witch_death_back:  "./assets/deaths/witch_death_back.png",
        witch_death_front: "./assets/deaths/witch_death_front.png",
        witch_death_left:  "./assets/deaths/witch_death_left.png",
        witch_death_right: "./assets/deaths/witch_death_right.png",

        bomb: "./assets/items/bomb.png",
        powerups: "./assets/items/powerups.png",
        mushroom: "./assets/items/shroom1.png",
        explosion: "./assets/explosion.png",
        wall_animation: "./assets/wall_animation.png",
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
