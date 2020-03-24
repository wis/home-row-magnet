/*
idx + 1:
1   2   3   4
5   6   7   8  
9   10  11  12
13  14  15  16
should return:
0,0 1,0 2,0 3,0
0,1 1,1 2,1 3,1
0,2 1,2 2,2 3,2
0,3 1,3 2,3 3,3
input: 0 - 15
*/
let LEN = 4,
  KEYS = "arstneioqwfpluyj".split("");
function idxToCords(idx, LEN, KEYS) {
  let col = idx % LEN;
  let row = Math.floor(idx / LEN);
  // let row = 0;
  return [col, row];
}
for (let idx = 0; idx < 16; idx++) {
  let cords = idxToCords(idx, LEN, KEYS);
  console.log(idx, cords);
}
