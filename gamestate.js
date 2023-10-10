import { PlayAudio } from "./audio.js";
import { clearBombs } from "./bomb.js";
import { newLevel } from "./main.js";
import { updateLevelDisplay, updateScoreDisplay } from "./page.js";
import { players } from "./player.js";
import { exitLocation} from "./tile.js";

export let pause = false;

export class Game {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.numOfEnemies = -1;
        this.firstBombExploded = false;
        this.isPaused = false;
    }

    init() {
        this.numOfEnemies = 0;
        // Escin kuuntelija (ehkä muualle?)
        document.addEventListener('keyup', function(event) {
            if (event.key === 'Escape') {
                // this.isPaused = !this.isPaused;
                // console.log("pause", this.isPaused);
                pause = !pause;
                console.log("pause", pause);
            }
        });
    }
    
    increaseScore(points) {
        this.score += points;
        updateScoreDisplay(this.score);
    }
    
    nextLevel() {
        this.level++;
        updateLevelDisplay(this.level);
        newLevel();
        clearBombs();
        this.saveGame();
    }
    
    increaseEnemies() {
        this.numOfEnemies++;
    }
    
    decreaseEnemies() {
        this.numOfEnemies--;
    }
    
    toggleDoor() {
        exitLocation.isOpen = !exitLocation.isOpen;
    }

    checkGameState() {
        if (this.numOfEnemies === 0 && exitLocation.isOpen === false) {
            this.toggleDoor();
            PlayAudio("assets/audio/exitopen01.wav");
        }
    }
    
    // Saving & loading
    // TODO: pelaajat häviää jos ottaa tallennetun powerupin
    // juuri jätetty pommi/tile räjähtää näkymättömänä kun lataa pelin
    // vihut jumahtaa (varmaan setter ongelma)
    
    saveGame() {
        // Save the display
        localStorage.setItem("level-number", this.level);
        localStorage.setItem("score", this.score);
        
        // Save the game state
        // localStorage.setItem("level", JSON.stringify(level));
        // localStorage.setItem("bombs", JSON.stringify(tilesWithBombs));
        // localStorage.setItem("exit", JSON.stringify(exitLocation));
        // localStorage.setItem("enemies", JSON.stringify(enemies));
        localStorage.setItem("players", JSON.stringify(players));
    }
    
    loadGame() {
        if (localStorage.length != 0) {
            // Load the display
            this.level = parseInt(localStorage.getItem("level-number"));
            this.score = parseInt(localStorage.getItem("score"));
            updateLevelDisplay(this.level);
            updateScoreDisplay(this.score);
            // Load the game state
            // const loadedLevel = JSON.parse(localStorage.getItem("level"));
            // clearBombs(loadedLevel);
            // // loadLevel(clearedLevel);
            // loadLevel(loadedLevel);
            
            // // const loadedBombs = JSON.parse(localStorage.getItem("bombs"));
            // // loadBombs(loadedBombs);
            
            // const loadedExit = JSON.parse(localStorage.getItem("exit"));
            // loadExit(loadedExit);
            
            // const loadedEnemies = JSON.parse(localStorage.getItem("enemies"));
            // loadEnemies(loadedEnemies);
            
            const loadedPlayers = JSON.parse(localStorage.getItem("players"));
            loadPowerups(loadedPlayers);
        }
    }
}

function loadPowerups(loadedPlayers) {
    for (let i = 0; i < players.length; i++) {
        // Player coords for savestate
        // players[i].x = loadedPlayers[i].x;
        // players[i].y = loadedPlayers[i].y;

        players[i].speed = loadedPlayers[i].speed;
        players[i].powerup.maxBombs = loadedPlayers[i].powerup.maxBombs;
        players[i].powerup.maxRange = loadedPlayers[i].powerup.maxRange;

        console.info("LOADED PLAYER", i+1, "\nSpeed:", players[i].speed, "Bombs:", players[i].powerup.maxBombs, "Range:", players[i].powerup.maxRange)
    }
}

// function loadBombs(loadedBombs) {
//     for (let i = 0; i < loadedBombs.length; i++) {
    //         console.log(loadedBombs[i]);
    //     }
    // }

// Testiksi eri class ettei mee sekavaksi
// Jotain tällästä rakennetta?
// http://gamedevgeek.com/tutorials/managing-game-states-in-c/
class GameState {
    constructor() {
        this.state = state;
        this.running = Boolean;
    }

    init() {
        //
    }

    cleanup() {
        // 
    }

    changeState(state) {
        // 
    }

    pushState(state) {
        // 
    }

    popState() {
        // 
    }

    handleEvents() {
        // 
    }

    update() {
        // 
    }

    draw() {
        // 
    }

    quit() {
       running = false; 
    }
}