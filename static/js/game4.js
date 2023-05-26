const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const btnReset = document.querySelector('.btn_game-restart');
const gameField = document.querySelector('.container_game');

const ground = new Image();
ground.src = '/static/img/ground_4.png';

const mario = new Image();
mario.src = '/static/img/mario3.png';

const foodImg = new Image();
foodImg.src = '/static/img/mushroom3.png';

let box = 32;

let score = 0;

let food = {
  x: Math.floor(Math.random() * 17 + 1) * box,
  y: Math.floor(Math.random() * 15 + 3) * box,
};

let snake = [];
snake[0] = {
  x: 9 * box,
  y: 10 * box,
};

document.addEventListener('keydown', direction);

let dir;

let sha256 = function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  let mathPow = Math.pow;
  let maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j; // Used as a counter across the whole file
  let result = '';

  let words = [];
  let asciiBitLength = ascii[lengthProperty] * 8;

  //* caching results is optional - remove/add slash from front of this line to toggle
  // Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
  // (we actually calculate the first 64, but extra values are just ignored)
  let hash = (sha256.h = sha256.h || []);
  // Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
  let k = (sha256.k = sha256.k || []);
  let primeCounter = k[lengthProperty];
  /*/
	let hash = [], k = [];
	let primeCounter = 0;
	//*/

  let isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80'; // Append Ƈ' bit (plus zero padding)
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00'; // More zero padding
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return; // ASCII check: only accept characters in range 0-255
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  // process each chunk
  for (j = 0; j < words[lengthProperty]; ) {
    let w = words.slice(j, (j += 16)); // The message is expanded into 64 words as part of the iteration
    let oldHash = hash;
    // This is now the undefinedworking hash", often labelled as letiables a...g
    // (we have to truncate as well, otherwise extra entries at the end accumulate
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      let i2 = i + j;
      // Expand the message into 64 words
      // Used below if
      let w15 = w[i - 15],
        w2 = w[i - 2];

      // Iterate
      let a = hash[0],
        e = hash[4];
      let temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + // S1
        ((e & hash[5]) ^ (~e & hash[6])) + // ch
        k[i] +
        // Expand the message schedule if needed
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + // s0
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | // s1
              0);
      // This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
      let temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + // S0
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj

      hash = [(temp1 + temp2) | 0].concat(hash); // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      let b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : '') + b.toString(16);
    }
  }
  return result;
};

function powToMod(base, power, module) {
  if (power === 1n) return base;
  if (power % 2n === 0n)
    return powToMod(base, power / 2n, module) ** 2n % module;
  return (powToMod(base, power - 1n, module) * base) % module;
}

function getRandomInteger(byte_lenght) {
  let cryptogen = new Uint8Array(Math.floor(Math.random() * byte_lenght) + 32);
  let x_mass = window.crypto.getRandomValues(cryptogen);
  let x_hex = '';
  for (let i = 0; i < x_mass.length; i++) {
    hex_i = x_mass[i].toString(16);
    if (hex_i.length < 2) {
      hex_i = '0' + hex_i;
    }
    x_hex = x_hex + hex_i;
  }
  let x = BigInt(parseInt(x_hex, 16));
  return x;
}
function gcd(a, b) {
  if (b > a) {
    let temp = a;
    a = b;
    b = temp;
  }
  while (true) {
    if (b == 0) return a;
    a %= b;
    if (a == 0) return b;
    b %= a;
  }
}
const getInvMod = (a, m) => {
  a = ((a % m) + m) % m;
  if (!a || m < 2n) return `входные данные не верны`;
  let [s, b] = [[], m];
  while (b) ([a, b] = [b, a % b]), s.push({ a, b });
  if (a !== 1n) return `'a' не обратимое, то есть не имеет обратного`;
  let [x, y] = [1n, 0n];
  for (let i = s.length - 2; i >= 0; --i)
    [x, y] = [y, x - y * (s[i].a / s[i].b)];
  return ((y % m) + m) % m;
};
function endGame(score) {
  let P =
    BigInt(
      6979520618971463181853952779744486485758205309313269005483564634973779590390774016808091656989799435166737441010157234689596767531301352351693565240807853n
    );
  let g = BigInt(2);
  let x = getRandomInteger(32);
  let y = powToMod(g, x, P);
  let h = BigInt('0x' + sha256(String(score)));
  let k = getRandomInteger(32);
  while (gcd(k, P - 1n) !== 1n) {
    k = k + 1n;
  }
  let r = powToMod(g, k, P);
  let k_inv = getInvMod(k, P - 1n);
  let s = ((h - x * r) * k_inv) % (P - 1n);
  if (s < 0) {
    s = P - 1n + s;
  }
  url =
    '/cabinet/game?score=' +
    String(score) +
    '&p=' +
    String(P) +
    '&y=' +
    String(y) +
    '&r=' +
    String(r) +
    '&s=' +
    String(s);
  let request = new XMLHttpRequest();
  request.open('POST', url, false);
  request.send();
}

function direction(event) {
  if (event.keyCode == 37 && dir != 'right') dir = 'left';
  else if (event.keyCode == 38 && dir != 'down') dir = 'up';
  else if (event.keyCode == 39 && dir != 'left') dir = 'right';
  else if (event.keyCode == 40 && dir != 'up') dir = 'down';
}

function eatTail(head, arr) {
  for (let i = 0; i < arr.length; i++) {
    if (head.x == arr[i].x && head.y == arr[i].y) {
      clearInterval(game);
      endGame(score);
      btnReset.style.opacity = '1';
      gameField.style.opacity = '0.65';
    }
  }
}

function drawGame() {
  ctx.drawImage(ground, 0, 0);

  ctx.drawImage(foodImg, food.x, food.y);

  for (let i = 0; i < snake.length; i++) {
    ctx.drawImage(mario, snake[i].x, snake[i].y);
    // ctx.fillStyle = i == 0 ? "green" : "red";
    // ctx.fillRect(snake[i].x, snake[i].y, box, box);
  }

  ctx.fillStyle = 'white';
  ctx.font = '50px MSB3_RUS';
  ctx.fillText(score, box * 2.5, box * 1.7);

  let snakeX = snake[0].x;
  let snakeY = snake[0].y;

  if (snakeX == food.x && snakeY == food.y) {
    score++;
    food = {
      x: Math.floor(Math.random() * 17 + 1) * box,
      y: Math.floor(Math.random() * 15 + 3) * box,
    };
  } else {
    snake.pop();
  }

  if (
    snakeX < box ||
    snakeX > box * 17 ||
    snakeY < 3 * box ||
    snakeY > box * 17
  ) {
    clearInterval(game);
    endGame(score);
    btnReset.style.opacity = '1';
    gameField.style.opacity = '0.65';
  }

  if (dir == 'left') snakeX -= box;
  if (dir == 'right') snakeX += box;
  if (dir == 'up') snakeY -= box;
  if (dir == 'down') snakeY += box;

  let newHead = {
    x: snakeX,
    y: snakeY,
  };

  eatTail(newHead, snake);

  snake.unshift(newHead);
}

let game = setInterval(drawGame, 110);