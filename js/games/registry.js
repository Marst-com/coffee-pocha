// 게임 추가 방법: games/ 폴더에 새 파일을 만들고 여기에 import + 배열에 추가하면 끝.
import tap from "./tap.js";
import memory from "./memory.js";
import catchGame from "./catch.js";
import math from "./math.js";
import numbers from "./numbers.js";
import whack from "./whack.js";
import reaction from "./reaction.js";
import timing from "./timing.js";
import stroop from "./stroop.js";
import stack from "./stack.js";

export const GAMES = [tap, memory, catchGame, math, numbers, whack, reaction, timing, stroop, stack];
export const gameById = (id) => GAMES.find((g) => g.id === id);
