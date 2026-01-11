import { Engine } from "./core/Engine.js";
import { Game } from "../Game.js";

const engine = new Engine();
const game = new Game(engine);

engine.init();
engine.start();

console.log("Echoes of Arkanis started");
