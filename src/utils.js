/* eslint-disable no-bitwise */

export const random = (from = 0, to = 1, interpolation = ((n) => n)) => {
  const range = to - from;
  return from + interpolation(Math.random()) * range;
};

export const chance = (c) => random() <= c;

export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export const elasticOut = (t) => {
  if (t <= 0) {
    return 0;
  }
  if (t >= 1) {
    return 1;
  }
  const c = (2 * Math.PI) / 3;
  return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * c) + 1;
};

export const quintIn = (t) => t ** 5;

export const quintInOut = (t) => {
  let d = t * 2;
  if (d < 1) {
    return 0.5 * d ** 5;
  }
  d -= 2.0;
  return 0.5 * (d ** 5 + 2);
};

export const animate = (duration, delay, animationFunc, done) => {
  const startTime = Date.now() + delay * 1000;
  const func = () => {
    const diff = Math.min(duration, (Date.now() - startTime) * 0.001);
    animationFunc(diff);
    if (diff < duration) {
      requestAnimationFrame(func);
    } else if (done) {
      done();
    }
  };
  setTimeout(func, delay * 1000);
};

export const addPressEvent = (id, func) => {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  const callback = (ev) => {
    ev.preventDefault();
    func(ev);
  };
  element.addEventListener('touchstart', callback);
  element.addEventListener('mousedown', callback);
};

export const stopPressEventPropagation = (id) => {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  const callback = (ev) => {
    ev.stopPropagation();
  };
  element.addEventListener('touchstart', callback);
  element.addEventListener('mousedown', callback);
};

export const printLog = (...args) => {
  // eslint-disable-next-line no-console
  console.log(...args);
};

export const printError = (...args) => {
  // eslint-disable-next-line no-console
  console.error(...args);
};

const crcTable = [];
let crcTableComputed = false;
const makeCRCTable = () => {
  let c;
  for (let n = 0; n < 256; n += 1) {
    c = n;
    for (let k = 0; k < 8; k += 1) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
        // c = 0x04C11DB7 ^ (c >> 1);
      } else {
        c >>>= 1;
      }
    }
    crcTable[n] = c;
  }
  crcTableComputed = true;
};

const updateCRC = (crc, data, start, end) => {
  let c = crc;
  if (!crcTableComputed) {
    makeCRCTable();
  }

  for (let n = start; n < end; n += 1) {
    c = crcTable[(c ^ data[n]) & 0xFF] ^ (c >>> 8);
  }
  return c;
};

export const crc32 = (data, start, end) => updateCRC(0xFFFFFFFF, data, start, end) ^ 0xFFFFFFFF;
