export default class Raindrop {
  constructor({
    x,
    y,
    radius,
    vx = 0,
    vy = 0,
    spreadX = 0,
    spreadY = 0,
    parent = null,
  }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = vx;
    this.vy = vy;
    this.spreadX = spreadX;
    this.spreadY = spreadY;
    this.nextSpawn = 0;
    this.lastSpawn = 0;
    this.parent = parent;
    this.isNew = true;
    this.isKilled = false;
    this.shrink = 0;
  }
}
