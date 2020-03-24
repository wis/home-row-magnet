const { ipcRenderer, remote } = require("electron");
const { BrowserWindow } = remote;
const robot = require("robotjs");
const MouseTrap = require("mousetrap");
const Trie = require("./data-structures/Trie.js");
const permutateWithRepetitionsTrieIter = require("./permutateWithRepetitionsTrieIter");
const toml = require("toml");
const fs = require("fs");

(async () => {
  const optionsData = fs.readFileSync("./options.toml");
  const options = toml.parse(optionsData);
  console.dir(options);

  robot.setMouseDelay(2); // Speed up the mouse.

  const canvas = document.querySelector("canvas");
  var { width, height } = window.screen;
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);

  const LEN = options.permutation.length;
  const KEYS = options.permutation.keys.split("");
  const INIT_MOVE_OP_KEY = options.key_bindings.move;

  // const trieIter = permutateWithRepetitionsTrieIter(KEYS, LEN);
  let trie, node;

  const ctx = canvas.getContext("2d");
  // ctx.font = "italic bold" + wordHeight + "px Arial";

  // ctx.fillStyle = "white";
  // ctx.fillRect(width /2, height /2, wordWidth, wordHeight);
  // ctx.fillText("1", width / 2, height / 2, wordWidth);

  ctx.strokeStyle = "#FFFFFF";
  ctx.textAlign = "center";
  function drawRect(xOffset, yOffset, width, height) {
    let cell = 0;
    let cellWidth = width / LEN,
      cellHeight = height / LEN;
    console.log("cellwidth", cellWidth, "cellheight", cellHeight);
    console.log("fond", ctx.font);
    ctx.strokeStyle = "#FFFFFF";
    ctx.fillStyle = "black";
    ctx.font = (Number(cellWidth * 0.9) + 2) + "px FreeMono";
    for (let y = 0; y < LEN; y++) {
      for (let x = 0; x < LEN; x++) {
        // if (cell % 2 === 0) {
        console.log("rendering", KEYS[cell], cell);
        ctx.fillText(
          KEYS[cell].toUpperCase(),
          xOffset + x * cellWidth + cellWidth / 2,
          yOffset + (y % 2 === 0 ? 0 : 1 + Math.floor(y / 2) * 2) + y * cellHeight + cellHeight,
          cellWidth
        );
        cell++;
      }
    }
    return [cellWidth, cellHeight];
  }
  console.time("draw");
  drawRect(0, 0, width, height);
  // let cell = 0;
  // for (let x = 0; x < width; x += wordWidth) {
  //   let y = wordHeight;
  //   for (; y < height; y += wordHeight) {
  //     drawNextWord(x, y, cell % 2 === 0);
  //     cell++;
  //   }
  //   drawNextWord(x, y);
  // }
  console.timeEnd("draw");

  let imageData = ctx.getImageData(0, 0, width, height);

  let input = "";
  let moveOp = false;
  // prevent default behaviour of Chromium shortcuts
  ["r", "w"].forEach(c => MouseTrap.bind("ctrl+" + c, () => false));
  ["r", "i"].forEach(c => MouseTrap.bind("ctrl+shift+" + c, () => false));
  MouseTrap.bind(INIT_MOVE_OP_KEY, e => {
    moveOp = true;
    return false;
  });
  for (let key of KEYS) {
    MouseTrap.bind(
      [
        key,
        key.toUpperCase(),
        "ctrl+" + key,
        "ctrl+shift+" + key,
        "alt+" + key
      ],
      e => {
        // console.log("key: " + e.key, e);
        console.log("event: ", e);
        const currentInput = input + e.key.toLowerCase();
        input += e.key.toLowerCase();
        console.log("currentInput: ", currentInput);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // const drawn = drawAllWordsStartingWith(currentInput);
        let idx = KEYS.findIndex(a => a === input[input.length - 1]);
        if (idx === -1) {
          return false;
        }
        let char = KEYS[idx];
        // if (currentInput.length === 1) {
        // }
        function getCoords(width, height, input) {
          let x = 0,
            y = 0;
          console.log("input", input, "input.length", input.length);
          if (input.length === 0) return [x, y];
          // let cidx = KEYS.findIndex(a => a === input[input.length - 1]);
          let cidx = KEYS.findIndex(a => a === input[0]);
          let cols = cidx % LEN;
          let rows = Math.floor(cidx / LEN);
          x = cols * (width / LEN);
          y = rows * (height / LEN);
          console.log("row", rows, "col", cols);
          let [subx, suby] = getCoords(
            width / LEN,
            height / LEN,
            // input.length > 0 ? input.substring(0, input.length - 1) : ""
            input.length > 0 ? input.substring(1) : ""
          );
          console.log("subx", subx, "suby", suby);
          x += subx;
          y += suby;
          console.log(x, y);
          return [x, y];
        }
        let [x, y] = getCoords(width, height, input);
        let [cellWidth, cellHeight] = drawRect(
          x,
          y,
          width / LEN ** input.length,
          height / LEN ** input.length
          // width / (input.length + 1),
          // height / (input.length + 1)
        );
        // drawRect(cols * (width /  LEN / input.length), rows * (height / LEN / input.length), width, height);
        if (currentInput.length === LEN) {
          BrowserWindow.getFocusedWindow().hide();
          ipcRenderer.send("setGlobalVariable", { hidden: true });
          robot.moveMouse(x + cellWidth / 2, y + cellHeight / 2);
          if (!moveOp) {
            if (e.ctrlKey) {
              robot.mouseClick("middle");
            } else if (e.shiftKey) {
              robot.mouseClick("right");
              // } else if (e.metaKey) {
            } else if (e.altKey) {
              robot.mouseClick("left");
              robot.mouseClick("left");
            } else {
              robot.mouseClick("left");
            }
          } else {
            robot.moveMouse(x + cellWidth, y + cellHeight);
            robot.moveMouse(x - cellWidth, y - cellHeight);
            robot.moveMouse(x + cellWidth / 2, y + cellHeight / 2);
            moveOp = false;
          }
          ctx.putImageData(imageData, 0, 0);
          input = "";
          return false;
        }
        return false;
      }
    );
  }
  // rest input
  MouseTrap.bind("escape", e => {
    input = "";
    ctx.putImageData(imageData, 0, 0);
  });
  ipcRenderer.on("repaint", () => {
    if (input !== "") {
      console.log("repainting..");
      ctx.putImageData(imageData, 0, 0);
      input = "";
    }
  });
})();
