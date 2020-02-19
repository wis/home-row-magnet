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

  const trieIter = permutateWithRepetitionsTrieIter(KEYS, LEN);
  let trie, node;

  const ctx = canvas.getContext("2d");
  let wordWidth = 26;
  let wordHeight = 12;
  ctx.font = "italic bold" + wordHeight + "px Arial";
  console.log("width", width, "wordWidth", wordWidth);
  console.log("height", height, "wordHeight", wordHeight);

  ctx.strokeStyle = "#FFFFFF";
  function drawNextWord(x, y, inverted) {
    let next = trieIter.next();
    if (!next.done) {
      [node, trie] = next.value;
      // console.log(trie);
      // console.log(node);
      drawWord(x, y, node.value.toUpperCase(), inverted);
      node.value = [x, y, inverted];
    }
  }
  function drawWord(x, y, text, inverted = false) {
    if (inverted) {
      ctx.fillStyle = "black";
    } else {
      ctx.fillStyle = "white";
      ctx.fillRect(x, y + 2, wordWidth, wordHeight);
    }
    ctx.fillText(text, x, y, wordWidth);
  }
  console.time("draw");
  let cell = 0;
  for (let x = 0; x < width; x += wordWidth) {
    let y = wordHeight;
    for (; y < height; y += wordHeight) {
      drawNextWord(x, y, cell % 2 === 0);
      cell++;
    }
    drawNextWord(x, y);
  }
  console.timeEnd("draw");

  let imageData = ctx.getImageData(0, 0, width, height);

  function drawAllWordsStartingWith(prefix) {
    let nextChars = trie.suggestNextCharacters(prefix);
    if (nextChars === null) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      input = input.slice(0, input.length - 1);
      drawAllWordsStartingWith(input);
      return false;
    }
    if (nextChars.length === 0) return true;
    for (let char of nextChars) {
      const word = prefix + char;
      const noMore = drawAllWordsStartingWith(word);
      if (noMore === true) {
        let [x, y, inverted] = trie.getLastCharacterNode(word).value;
        drawWord(
          x,
          y,
          (" ".repeat(input.length) + word.slice(input.length)).toUpperCase(),
          inverted
        );
      }
    }
  }

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
        const drawn = drawAllWordsStartingWith(currentInput);
        if (drawn === false) {
          return false;
        }
        if (currentInput.length === LEN) {
          const lastCharNode = trie.getLastCharacterNode(currentInput);
          if (lastCharNode === null) {
            input = input.slice(0, input.length - 1);
            drawAllWordsStartingWith(input);
            return false;
          }
          let [x, y] = lastCharNode.value;
          BrowserWindow.getFocusedWindow().hide();
          ipcRenderer.send("setGlobalVariable", { hidden: true });
          robot.moveMouse(x + wordWidth / 2, y + wordHeight / 2);
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
            robot.moveMouse(x + wordWidth, y + wordHeight);
            robot.moveMouse(x - wordWidth, y - wordHeight);
            robot.moveMouse(x + wordWidth / 2, y + wordHeight / 2);
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
