/* eslint-disable no-bitwise */

import Bone from './Bone';
import BoneData from './BoneData';
import DrawingData from './DrawingData';
import PhotoData from './PhotoData';
import Raindrop from './Raindrop';
import BufferShader from './shaders/BufferShader';
import CharacterShader from './shaders/CharacterShader';
import DrawingShader from './shaders/DrawingShader';
import RainShader from './shaders/RainShader';
import ImageShader from './shaders/ImageShader';
import InnerWindowShader from './shaders/InnerWindowShader';
import OuterWindowShader from './shaders/OuterWindowShader';
import {
  random, chance, animate, printError, convertNumToChar, convertCharToNum,
} from './utils';

const calcDragPoint = (touches) => {
  const pt = [0, 0];
  for (let i = 0; i < touches.length; i += 1) {
    const touch = touches[i];
    pt[0] += touch.clientX;
    pt[1] += touch.clientY;
  }
  return [pt[0] / touches.length, pt[1] / touches.length];
};

export default class Canvas {
  constructor(width, height) {
    this.isPlaying = false;
    this.isResetting = false;
    this.screenshotResolve = null;

    this.drawingLogs = [];

    this.isAutoPlaying = false;
    this.autoPlayTime = 60000;
    this.autoPlayIndex = 0;
    this.autoPlayOffsetX = 0;
    this.autoPlayOffsetY = 0;
    this.autoPlayData = null;
    this.watchdog = null;
    this.cleanAreas = [
      [true, true, true, true],
      [true, true, true, true],
      [true, true, true, true],
      [true, true, true, true],
    ];

    this.fingerPos = [53, 169];

    this.canvas = document.createElement('canvas');
    this.canvas.tabIndex = 1; // get keydown/up events
    this.canvas.style.width = width || '100%';
    this.canvas.style.height = height || '100%';
    this.canvas.style.objectFit = 'contain';

    this.requestAnimationFrame = window.requestAnimationFrame
                                    || window.webkitRequestAnimationFrame
                                    || window.mozRequestAnimationFrame
                                    || window.oRequestAnimationFrame
                                    || window.msRequestAnimationFrame
                                    || ((callback) => { window.setTimeout(callback, 1000 / 60); });

    const opt = {
      alpha: true,
      depth: true,
      stencil: true,
      antialias: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      preferLowPowerToHighPerformance: false,
      failIfMajorPerformanceCaveat: false,
    };

    try {
      this.context = this.canvas.getContext('webgl2', opt);
    } catch (e) {
      printError('Failed to create WebGL2 context', e);
      throw e;
    }

    this.characterShader = new CharacterShader(this.context);
    this.drawingShader = new DrawingShader(this.context);
    this.bufferShader = new BufferShader(this.context, { buffer: this.drawingShader.frameTexture });
    this.rainShader = new RainShader(this.context);
    this.imageShader = new ImageShader(this.context, {
      src: './img/background.png',
      buffer: this.characterShader.frameBuffer,
    });
    this.innerWindowShader = new InnerWindowShader(this.context, {
      backgroundSampler: this.characterShader.frameTexture,
      frostSampler: this.drawingShader.frameTexture,
    });
    this.outerWindowShader = new OuterWindowShader(this.context, {
      backgroundSampler: this.innerWindowShader.frameTexture,
      rainSampler: this.rainShader.frameTexture,
    });

    this.readyPromise = new Promise((resolve) => {
      const promises = [
        this.characterShader,
        this.drawingShader,
        this.bufferShader,
        this.rainShader,
        this.imageShader,
        this.innerWindowShader,
        this.outerWindowShader,
      ].map((shader) => shader.readyPromise);
      Promise.all(promises).then(resolve);
    });

    this.drops = [];
    this.drawingPoints = [];
    this.previousPoint = null;
    this.previousTouch = null;

    this.isRaining = true;
    this.minR = 20;
    this.maxR = 50;
    this.maxDrops = 900;
    this.rainChance = 0.35;
    this.rainLimit = 6;
    this.dropletsRate = 50;
    this.dropletsSize = [3, 5.5];
    this.trailRate = 1;
    this.trailScaleRange = [0.2, 0.45];
    this.collisionRadius = 0.45;
    this.dropletsCleaningRadiusMultiplier = 0.28;
    this.flashChance = 0;
    this.collisionRadiusIncrease = 0.0002;
    this.collisionBoostMultiplier = 0.05;
    this.collisionBoost = 1.0;
    this.dropFallMultiplier = 1;
    this.autoShrink = true;
    this.globalTimeScale = 1.0;
    this.lastRender = null;

    this.areaMultiplier = 1.0;
    this.timeScale = 1.0;
    this.spawnArea = [-0.1, 0.95];
    this.width = 0;
    this.height = 0;
    this.scale = window.devicePixelRatio;

    this.xPosScale = 1.0;
    this.yPosScale = 1.0;
    this.xPosOffset = 0;
    this.yPosOffset = 0;
    this.xPosUserOffset = 0;
    this.yPosUserOffset = 0;
    this.xMaxOffset = 0;
    this.yMaxOffset = 0;

    this.body = new Bone();
    this.body.position = BoneData.getPosition('root', 'body');

    this.upperArm = new Bone();
    this.upperArm.parent = this.body;
    this.upperArm.position = BoneData.getPosition('body', 'upperArm', true);

    this.lowerArm = new Bone();
    this.lowerArm.parent = this.upperArm;
    this.lowerArm.position = BoneData.getPosition('upperArm', 'lowerArm');

    this.hand = new Bone();
    this.hand.parent = this.lowerArm;
    this.hand.position = BoneData.getPosition('lowerArm', 'hand', true);

    this.head = new Bone();
    this.head.parent = this.body;
    this.head.position = BoneData.getPosition('body', 'head', true);

    this.mouth = new Bone();
    this.mouth.parent = this.head;
    this.mouth.position = BoneData.getPosition('head', 'mouth', true);

    this.hair = new Bone();
    this.hair.parent = this.head;
    this.hair.position = BoneData.getPosition('head', 'hair1', true);

    this.hair2 = new Bone();
    this.hair2.parent = this.head;
    this.hair2.position = BoneData.getPosition('head', 'hair2', true);

    this.bones = [
      this.body,
      this.upperArm,
      this.lowerArm,
      this.hand,
      this.head,
      this.mouth,
      this.hair,
      this.hair2,
    ];

    this.isDrawing = false;
    this.isDragging = false;
    this.canvas.addEventListener('mousedown', (ev) => {
      ev.preventDefault();
      this.stopWatchdog();
      this.isDrawing = true;
      this.addDrawingPoint(ev);
    });
    this.canvas.addEventListener('touchstart', (ev) => {
      ev.preventDefault();
      this.stopWatchdog();

      const touches = ev.targetTouches;
      if (touches.length >= 2) {
        this.dragPoint = calcDragPoint(touches);
        return;
      }

      this.isDrawing = true;
      if (this.previousTouch) {
        return;
      }

      if (touches.length === 1) {
        const touch = touches[0];
        this.addDrawingPoint(touch);
        this.previousTouch = touch;
      }
    });
    this.canvas.addEventListener('mousemove', (ev) => {
      const pt = this.convertPosition(ev);
      this.fingerPos = pt;

      if (this.isDragging) {
        // TODO: Refactor
        const dx = pt[0] - this.previousPoint[0];
        const dy = pt[1] - this.previousPoint[1];
        this.moveOffset(dx, dy);
        this.previousPoint = pt;
      } else if (this.isDrawing) {
        this.addDrawingPoint(ev);
      } else {
        this.resetWatchdog();
      }
    });
    this.canvas.addEventListener('touchmove', (ev) => {
      ev.preventDefault();
      this.resetWatchdog();

      const touches = ev.targetTouches;
      if (touches.length >= 2 && this.dragPoint) {
        const newDragPoint = calcDragPoint(touches);
        this.moveOffset(
          -(newDragPoint[0] - this.dragPoint[0]) * window.devicePixelRatio,
          (newDragPoint[1] - this.dragPoint[1]) * window.devicePixelRatio,
        );
        this.dragPoint = newDragPoint;
        this.updateOffset();
        return;
      }

      let touch = null;
      for (let i = 0; i < touches.length; i += 1) {
        if (touches[i].identifier === this.previousTouch?.identifier) {
          touch = touches[i];
        }
      }

      if (!touch) {
        this.resetWatchdog();
        return;
      }
      const pt = this.convertPosition(touch);
      this.fingerPos = pt;

      if (this.isDragging) {
        const dx = pt[0] - this.previousPoint[0];
        const dy = pt[1] - this.previousPoint[1];
        this.moveOffset(dx, dy);
        this.previousPoint = pt;
        return;
      }
      if (this.isDrawing) {
        this.addDrawingPoint(touch);
      }
    });
    document.addEventListener('mouseup', () => {
      this.isDrawing = false;
      this.previousPoint = null;
      this.dragPoint = null;
      this.addNullToDrawingLogs();
      this.resetWatchdog();
    });
    document.addEventListener('touchend', (ev) => {
      const touches = ev.changedTouches;
      for (let i = 0; i < touches.length; i += 1) {
        if (touches[i].identifier === this.previousTouch?.identifier) {
          this.isDrawing = false;
          this.previousPoint = null;
          this.previousTouch = null;
          this.addNullToDrawingLogs();
        }
      }
      this.resetWatchdog();
    });
    document.addEventListener('mousewheel', (ev) => {
      if (this.yMaxOffset > 0) {
        this.moveOffset(0, ev.wheelDelta);
      } else if (this.xMaxOffset > 0) {
        this.moveOffset(ev.wheelDelta, 0);
      }
      this.updateOffset();
    });

    this.innerWindowShader.setUniform('parallax', [0, 0]);
    this.innerWindowShader.setUniform('parallaxFg', [20.0]);
    this.innerWindowShader.setUniform('textureRatio', [1.0]); // aspect ratio
    this.innerWindowShader.setUniform('frostAlpha', [0.8]);
    this.innerWindowShader.setUniform('frostAdd', [0.0]);

    this.outerWindowShader.setUniform('offset', [0, 0]);
    this.outerWindowShader.setUniform('parallax', [0, 0]);
    this.outerWindowShader.setUniform('parallaxFg', [20.0]);
    this.outerWindowShader.setUniform('parallaxBg', [5.0]);
    this.outerWindowShader.setUniform('textureRatio', [1.0]); // aspect ratio
    this.outerWindowShader.setUniform('minRefraction', [256 / 1024]);
    this.outerWindowShader.setUniform('refractionDelta', [256 / 1024]);
    this.outerWindowShader.setUniform('brightness', [1.04]);
    this.outerWindowShader.setUniform('alphaMultiply', [6.0]);
    this.outerWindowShader.setUniform('alphaSubtract', [3.0]);

    this.drawingShader.clearCanvas(1, 1, 1, 0);
    this.drawingShader.setUniform('size', [10]);
  }

  convertPosition(ev) {
    const x = ev.clientX * this.xPosScale + this.xPosOffset + this.xPosUserOffset / 2;
    const y = ev.clientY * this.yPosScale + this.yPosOffset - this.yPosUserOffset / 2;
    return [x, y];
  }

  addNullToDrawingLogs() {
    if (this.drawingLogs.length <= 0) {
      return;
    }
    if (this.drawingLogs[this.drawingLogs.length - 1] !== null) {
      this.drawingLogs.push(null);
    }
  }

  addDrawingPoint(ev, autoplay = false) {
    const pt = autoplay ? ev : this.convertPosition(ev);
    this.fingerPos = pt;
    this.drawingLogs.push(pt);

    const ix = Math.max(0, Math.min(3, Math.floor(pt[0] / 256)));
    const iy = Math.max(0, Math.min(3, Math.floor(pt[1] / 256)));
    this.cleanAreas[ix][iy] = false;

    if (this.previousPoint) {
      const dx = pt[0] - this.previousPoint[0];
      const dy = pt[1] - this.previousPoint[1];
      const len = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.ceil(len);
      const stepX = dx / steps;
      const stepY = dy / steps;
      let x = this.previousPoint[0];
      let y = this.previousPoint[1];
      for (let i = 0; i < steps; i += 1) {
        x += stepX;
        y += stepY;
        this.drawingPoints.push(x, y);
      }
    } else {
      this.drawingPoints.push(...pt);
    }

    this.previousPoint = pt;
  }

  moveOffset(x, y) {
    const newX = this.xPosOffset + this.xPosUserOffset + x;
    const newY = this.yPosOffset + this.yPosUserOffset + y;
    const newOffsetX = Math.max(-this.xMaxOffset, Math.min(this.xMaxOffset, newX));
    const newOffsetY = Math.max(
      this.yScreenOffset,
      Math.min(this.yMaxOffset - this.yScreenOffset, newY),
    );
    this.xPosUserOffset = newOffsetX - this.xPosOffset;
    this.yPosUserOffset = newOffsetY - this.yPosOffset;
  }

  resizeCanvas(width, height) {
    const w = width || this.canvas.clientWidth;
    const h = height || this.canvas.clientHeight;

    this.scale = window.devicePixelRatio;
    this.width = w;
    this.height = h;
    this.scaledWidth = w * this.scale;
    this.scaledHeight = h * this.scale;
    this.windowSize = 1024;
    this.areaMultiplier = this.windowSize / 1024;
    this.canvas.width = this.scaledWidth;
    this.canvas.height = this.scaledHeight;

    const xScale = this.windowSize / w;
    const yScale = this.windowSize / h;
    if (xScale > yScale) {
      this.xPosScale = yScale;
      this.yPosScale = yScale;
      this.xPosOffset = this.windowSize - yScale * w;
      this.yPosOffset = 0;
      this.yScreenOffset = 0;
    } else {
      this.xPosScale = xScale;
      this.yPosScale = xScale;
      this.xPosOffset = 0;
      this.yPosOffset = (this.windowSize - xScale * h) / 2;
      this.yScreenOffset = -this.yPosOffset;
    }
    this.xMaxOffset = this.xPosOffset;
    this.yMaxOffset = this.yPosOffset * 2;
    this.moveOffset(0, 0);

    this.screenSizeChanged = true;
  }

  updateScreenScale() {
    this.characterShader.resize(this.scaledWidth, this.scaledHeight);
    this.drawingShader.resize(this.scaledWidth, this.scaledHeight);
    this.bufferShader.resize(this.scaledWidth, this.scaledHeight);
    this.rainShader.resize(this.scaledWidth, this.scaledHeight);
    this.imageShader.resize(this.scaledWidth, this.scaledHeight);
    this.innerWindowShader.resize(this.scaledWidth, this.scaledHeight);
    this.outerWindowShader.resize(this.scaledWidth, this.scaledHeight);

    this.updateOffset();
  }

  updateOffset() {
    this.outerWindowShader.setUniform('offset', [
      (this.xPosOffset + this.xPosUserOffset) / this.windowSize,
      (this.yPosOffset + this.yPosUserOffset + this.yScreenOffset) / this.windowSize,
      // 0,
    ]);
  }

  appendTo(element) {
    element.appendChild(this.canvas);

    this.resizeCanvas();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.resizeCanvas();
      });
    }

    // Workaround for the canvas size shrinkage
    setTimeout(() => this.resizeCanvas(), 1);
  }

  requestNextFrame() {
    this.requestAnimationFrame.call(window, () => {
      if (this.isAutoPlaying) {
        const data = this.autoPlayData[this.autoPlayIndex];
        if (data) {
          const x = data[0] + this.autoPlayOffsetX;
          const y = data[1] + this.autoPlayOffsetY;
          this.addDrawingPoint([x, y], true);
        } else {
          this.previousPoint = null;
          this.addNullToDrawingLogs();
        }
        this.autoPlayIndex += 1;
        if (this.autoPlayIndex >= this.autoPlayData.length) {
          this.resetWatchdog();
        }
      }

      if (this.screenshotResolve) {
        this.outerWindowShader.setUniform('offset', [0, 0]);
        const currentPos = this.fingerPos;
        this.fingerPos = this.characterShader.setRandomPose();
        this.update(true);
        this.generateScreenshot();
        this.characterShader.setMode(0, 0);
        this.fingerPos = currentPos;
        this.updateOffset();
      } else {
        this.update(false);
        this.outerWindowShader.usesFrameBuffer = false;
        this.draw(false);
      }

      if (this.isPlaying) {
        this.requestNextFrame();
      }
    });
  }

  resetDrawing() {
    if (this.isResetting) {
      return;
    }
    this.isResetting = true;

    this.characterShader.setMode(0, 2);
    const dur = 1.0;
    animate(dur, 0, (t) => {
      this.innerWindowShader.setUniform('frostAdd', [t / dur]);
    }, () => {
      this.drawingShader.clearCanvas(1, 1, 1, 0);
      this.innerWindowShader.setUniform('frostAdd', [0.0]);
      this.characterShader.setMode(0, 0);
      this.isResetting = false;

      for (let x = 0; x < 4; x += 1) {
        for (let y = 0; y < 4; y += 1) {
          this.cleanAreas[x][y] = true;
        }
      }
      this.drawingLogs = [];
    });
  }

  generateScreenshot() {
    const gl = this.context;

    const width = this.windowSize;
    const height = this.windowSize;

    this.outerWindowShader.usesFrameBuffer = true;
    this.outerWindowShader.resize(width, height);

    this.draw(true);

    // Read the contents of the framebuffer
    const data = new Uint8Array(width * height * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.outerWindowShader.frameBuffer);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    const imageData = context.createImageData(width, height);
    imageData.data.set(data);
    context.putImageData(imageData, 0, 0);

    const canvas2 = document.createElement('canvas');
    canvas2.width = width;
    canvas2.height = height;
    const context2 = canvas2.getContext('2d');

    context2.scale(1, -1);
    context2.drawImage(canvas, 0, -height);

    const resolve = this.screenshotResolve;

    canvas2.toBlob((imageBlob) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const buffer = ev.target.result;
        const arr = new Uint8Array(buffer, 0, buffer.length);
        const dataView = new DataView(arr.buffer);

        let pos = 8;
        let chunk0 = [];
        let chunk1 = [];
        let ihdrPos = null;
        while (pos < arr.length) {
          const headPos = pos;
          const chunkSize = dataView.getUint32(pos, false);
          let type = '';
          pos += 4;
          for (let i = 0; i < 4; i += 1) {
            type += String.fromCharCode(arr[pos + i]);
          }
          pos += 4;
          if (type === 'IHDR') {
            ihdrPos = pos + chunkSize + 4;
          } else if (type === 'eXIf') {
            chunk0 = arr.slice(0, headPos);
            chunk1 = arr.slice(pos + chunkSize + 4, arr.length);
            break;
          } else if (type === 'IEND') {
            chunk0 = arr.slice(0, ihdrPos);
            chunk1 = arr.slice(ihdrPos, arr.length);
            break;
          }
          pos += chunkSize + 4;
        }

        const png = new Blob([
          chunk0.buffer,
          (new Uint8Array(PhotoData)).buffer,
          chunk1.buffer,
        ], { type: 'image/png' });

        const reader2 = new FileReader();
        reader2.onload = (e) => {
          const image = new Image();
          image.src = e.target.result;
          resolve(image);
        };
        reader2.readAsDataURL(png);
      };
      reader.readAsArrayBuffer(imageBlob);
    }, 'image/png');

    this.screenshotResolve = null;

    this.outerWindowShader.resize(this.scaledWidth, this.scaledHeight);
    this.outerWindowShader.usesFrameBuffer = false;
  }

  generateDrawingURL() {
    const maxDataCount = 1350; // 1381
    const logLength = this.drawingLogs.length;
    let dataCount = 0;
    let index = logLength - 1;
    for (; index >= 0; index -= 1) {
      if (this.drawingLogs[index] === null) {
        dataCount += 1;
      } else {
        dataCount += 3;
      }
      if (dataCount >= maxDataCount) {
        break;
      }
    }

    const overflow = (index >= 0);
    index = Math.max(0, index);

    let url = `${window.location.origin + window.location.pathname}?d=`;
    for (let i = index; i < logLength; i += 1) {
      if (this.drawingLogs[i] === null) {
        if (i < logLength - 1) {
          url += ',';
        }
      } else {
        const x = Math.max(0, Math.min(511, Math.round(this.drawingLogs[i][0] * 0.5)));
        const y = Math.max(0, Math.min(511, Math.round(this.drawingLogs[i][1] * 0.5)));
        const b0 = ((x & 0x1F8) >> 3);
        const b1 = ((x & 0x7) << 3) | ((y & 0x1C0) >> 6);
        const b2 = (y & 0x3F);
        url += convertNumToChar(b0) + convertNumToChar(b1) + convertNumToChar(b2);
      }
    }

    return [url, overflow];
  }

  loadDrawingURL() {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('d');
    if (!data || data.length <= 0) {
      return;
    }

    this.previousPoint = null;
    let index = 0;
    while (index < data.length) {
      if (data[index] === ',') {
        this.previousPoint = null;
        this.addNullToDrawingLogs();
        index += 1;
      } else {
        const b0 = convertCharToNum(data[index]);
        const b1 = convertCharToNum(data[index + 1]);
        const b2 = convertCharToNum(data[index + 2]);
        const x = (b0 << 3) | ((b1 >>> 3) & 0x7);
        const y = ((b1 & 0x7) << 6) | (b2 & 0x3F);
        this.addDrawingPoint([x * 2.0, y * 2.0], true);
        index += 3;
      }
    }
    this.previousPoint = null;
    this.addNullToDrawingLogs();
  }

  update(screenshot) {
    const now = Date.now();
    if (this.lastRender === null) {
      this.lastRender = now;
    }
    const deltaT = now - this.lastRender;
    const timeScale = Math.max(1.1, deltaT * 60 * 0.001);
    this.timeScale = timeScale * this.globalTimeScale;
    this.lastRender = now;

    this.updateCharacter(screenshot);
    this.updateDrawing();
    this.updateRain();

    this.drops.sort((a, b) => {
      const va = a.y * this.windowSize + a.x;
      const vb = b.y * this.windowSize + b.x;
      return vb - va;
    });

    const deltaR = 0.1 / (this.maxR - this.minR) * this.timeScale;
    this.drops.forEach((drop, i) => {
      if (drop.isKilled) {
        return;
      }

      if (chance((drop.radius - this.minR * this.dropFallMultiplier) * deltaR)) {
        drop.vy += random(0, drop.radius / this.maxR * 4);
      }

      if (this.autoShrink && drop.radius <= this.minR && chance(0.05 * this.timeScale)) {
        drop.shrink += 0.01;
      }

      drop.radius -= drop.shrink * this.timeScale;
      if (drop.radius <= 0) {
        drop.isKilled = true;
      }

      if (this.isRaining) {
        drop.lastSpawn += drop.vy * this.timeScale * this.trailRate;

        const rainFull = this.drops.length >= (this.maxDrops * this.areaMultiplier);
        if (!rainFull && drop.lastSpawn > drop.nextSpawn) {
          const trailDrop = new Raindrop({
            x: drop.x + random(-drop.radius, drop.radius) * 0.1,
            y: drop.y - drop.radius * 0.01,
            radius: drop.radius * random(...this.trailScaleRange),
            spreadY: drop.vy * 0.1,
            parent: drop,
          });

          this.drops.push(trailDrop);
          drop.radius *= 0.97 ** this.timeScale;
          drop.lastSpawn = 0;
          drop.nextSpawn = random(this.minR, this.maxR)
            - drop.vy * 2 * this.trailRate
            + this.maxR - drop.radius;
        }
      }

      drop.spreadX *= 0.4 ** this.timeScale;
      drop.spreadY *= 0.7 ** this.timeScale;

      const moved = drop.vy > 0;
      if (moved && !drop.isKilled) {
        drop.y += drop.vy * this.globalTimeScale;
        drop.x += drop.vx * this.globalTimeScale;
        if (drop.y > this.windowSize + drop.radius) {
          drop.isKilled = true;
        }
      }

      const checkCollision = (moved || drop.isNew) && !drop.isKilled;
      drop.isNew = false;

      if (checkCollision) {
        this.drops.slice(i + 1, i + 70).forEach((drop2) => {
          if (
            drop !== drop2
            && drop.radius > drop2.radius
            && drop.parent !== drop2
            && drop2.parent !== drop
            && !drop2.isKilled
          ) {
            const dx = drop2.x - drop.x;
            const dy = drop2.y - drop.y;
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < (drop.radius + drop2.radius)
            * (this.collisionRadius + drop.vy * this.collisionRadiusIncrease * this.timeScale)) {
              const area1 = drop.radius * drop.radius;
              const area2 = drop2.radius * drop2.radius;
              const targetRadius = Math.min(this.maxR, Math.sqrt(area1 + area2 * 0.8));
              drop.radius = targetRadius;
              drop.vx += dx * 0.1;
              drop.spreadX = 0;
              drop.spreadY = 0;
              drop2.isKilled = true;
              drop.vy = Math.max(drop2.vy, Math.min(
                40,
                drop.vy + targetRadius * this.collisionBoostMultiplier + this.collisionBoost,
              ));
            }
          }
        });
      }

      drop.vy -= Math.max(1.0, this.minR * 0.5 - drop.vy) * 0.1 * this.timeScale;
      drop.vy = Math.max(0, drop.vy);
      drop.vx *= 0.7 ** this.timeScale;
    });

    this.drops = this.drops.filter((drop) => !drop.isKilled);

    const data = [];
    this.drops.forEach((drop) => {
      let thickness = Math.max(0, Math.min(1, (drop.radius - this.minR) / this.deltaR * 0.9));
      thickness *= 1.0 / ((drop.spreadX + drop.spreadY) * 0.5 + 1.0);
      data.push(drop.x, drop.y, drop.radius, thickness, drop.spreadX, drop.spreadY);
    });
    this.rainShader.setInstanceData(data);

    if (this.screenSizeChanged) {
      this.updateScreenScale();
      this.screenSizeChanged = false;
    }
  }

  updateCharacter() {
    this.body.rotation = Math.PI;
    this.upperArm.rotation = -Math.PI;
    this.lowerArm.rotation = Math.PI;
    this.hand.rotation = -Math.PI;
    this.hair.rotation = -Math.PI;
    this.hair2.rotation = -Math.PI * 170 / 180;
    this.head.rotation = -10 / 180 * Math.PI;
    this.mouth.rotation = 0;

    const { fingerPos } = this;

    const t = Date.now() * 0.0005;
    const sinT = Math.sin(t);
    this.hair.rotation = -Math.PI - (sinT + 1.0) * 3.0 / 180.0 * Math.PI;
    this.hair2.rotation = -Math.PI * 172 / 180 - (sinT + 1.0) * 3.0 / 180.0 * Math.PI;
    this.head.rotation = (sinT - 1.0) * 4.0 / 180.0 * Math.PI;

    const upperRot = Math.atan2(fingerPos[0], this.windowSize + fingerPos[1]) - Math.PI;
    const handRot = Math.atan2(fingerPos[0], this.windowSize * 1.5 - fingerPos[1]) - Math.PI;

    const fx = 1300 - 1216;
    const fy = 1479 - 1080;
    const fingerLen = Math.sqrt(fx * fx + fy * fy);
    const fingerRot = 7 / 180 * Math.PI;
    this.hand.parent = null;
    this.hand.rotation = -handRot;
    const handPos = [
      fingerPos[0] - fingerLen * Math.sin(this.hand.rotation + fingerRot) - this.windowSize * 0.5,
      fingerPos[1] - fingerLen * Math.cos(this.hand.rotation + fingerRot) - this.windowSize * 0.5,
    ];
    this.hand.position = handPos;

    this.upperArm.rotation = upperRot;
    this.upperArm.update();
    this.lowerArm.update();
    const armPos = this.lowerArm.getWorldPosition();

    const lx = 775 - 755;
    const ly = 1839 - 1373;
    const armLength = Math.sqrt(lx * lx + ly * ly);

    const diff = [handPos[0] + 20 - armPos[0], handPos[1] - armPos[1]];
    const diffLength = Math.sqrt(diff[0] * diff[0] + diff[1] * diff[1]);
    const lengthAdj = diff[0] / diffLength * 60.0;
    const lowerRot = Math.atan2(diff[0], diff[1]) - Math.PI;
    const scale = Math.max(0.3, (diffLength + lengthAdj) / armLength);

    this.lowerArm.rotation = lowerRot - upperRot;
    this.lowerArm.scale = [1, scale];

    this.bones.forEach((bone) => {
      bone.update();
    });

    const mat = [];
    this.bones.forEach((bone) => {
      mat.push(...bone.worldMatrix);
    });
    this.characterShader.setUniformMatrix('bones', mat);
  }

  updateRain() {
    if (!this.isRaining) {
      return;
    }

    const limit = this.rainLimit * this.timeScale * this.areaMultiplier;
    const maxDrops = this.maxDrops * this.areaMultiplier;
    let count = 0;
    while (chance(this.rainChance * this.timeScale * this.areaMultiplier)
    && count < limit && this.drops.length < maxDrops) {
      count += 1;
      const r = random(this.minR, this.maxR, (n) => n ** 3);
      const rainDrop = new Raindrop({
        x: random(0, this.windowSize),
        y: random(
          this.windowSize * this.spawnArea[0],
          this.windowSize * this.spawnArea[1],
        ),
        radius: r,
        vy: 1 + ((r - this.minR) * 0.1) + random(0, 2),
        spreadX: 1.5,
        spreadY: 1.5,
      });

      this.drops.push(rainDrop);
    }
  }

  updateDrawing() {
    this.drawingShader.setInstanceData(this.drawingPoints);
    this.drawingPoints = [];
  }

  draw() {
    const gl = this.context;

    // Set uniforms

    this.imageShader.draw();
    this.characterShader.draw();
    this.drawingShader.draw();
    // this.bufferShader.draw();
    this.rainShader.draw();
    this.innerWindowShader.draw();
    this.outerWindowShader.draw();

    gl.flush();
  }

  play() {
    if (this.isPlaying) {
      return;
    }
    this.isPlaying = true;
    this.resetWatchdog();

    this.requestNextFrame();
  }

  pause() {
    this.isPlaying = false;
  }

  screenshot() {
    return new Promise((resolve) => {
      this.screenshotResolve = resolve;
    });
  }

  setAutoPlayOffset() {
    const dx = Math.floor(Math.random() * 4);
    const dy = Math.floor(Math.random() * 4);
    for (let x = 0; x < 4; x += 1) {
      for (let y = 0; y < 4; y += 1) {
        const ix = (x + dx) % 4;
        const iy = (y + dy) % 4;
        if (this.cleanAreas[ix][iy]) {
          this.autoPlayOffsetX = ix * 256;
          this.autoPlayOffsetY = iy * 256;
          return true;
        }
      }
    }
    return false;
  }

  autoPlay() {
    const found = this.setAutoPlayOffset();
    if (!found) {
      return;
    }
    clearTimeout(this.watchdog);
    this.autoPlayIndex = 0;

    const numData = DrawingData.length;
    const dataIndex = Math.floor(Math.random() * numData);
    this.autoPlayData = DrawingData[dataIndex];

    this.isAutoPlaying = true;
    this.characterShader.setMode(0, 1);
  }

  resetWatchdog() {
    this.stopWatchdog();
    this.startWatchdog();
  }

  startWatchdog() {
    this.watchdog = setTimeout(() => this.autoPlay(), this.autoPlayTime);
  }

  stopWatchdog() {
    clearTimeout(this.watchdog);
    if (this.isAutoPlaying) {
      this.characterShader.setMode(0, 0);
      this.previousPoint = null;
    }
    this.isAutoPlaying = false;
  }
}
